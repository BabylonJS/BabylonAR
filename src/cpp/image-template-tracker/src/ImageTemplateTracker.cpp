#include "ImageTemplateTracker.h"

ImageTemplateTracker::ImageTemplateTracker(const cv::Mat& image, const cv::Point2i& templatePosition, Settings settings)
    : m_settings{ settings }
{
    updateTrackingImage(image);
    updateMostRecentTemplate(imageSpaceToTrackingSpace(templatePosition));
    m_originalTemplate = m_recentTemplate.clone();
}

bool ImageTemplateTracker::TrackTemplateInImage(const cv::Mat& image)
{
    updateTrackingImage(image);

    int minX;
    int minY;
    if (m_recentTemplate.empty())
    {
        m_recentTemplate = m_originalTemplate;

        minX = 0;
        minY = 0;
        croppedImage = trackingImage;
    }
    else
    {
        minX = std::max(0, m_templatePosition.x - m_settings.TemplateSideLen);
        int maxX = std::min(m_templatePosition.x + m_settings.TemplateSideLen, m_settings.TrackingImageSideLen - 1);
        minY = std::max(0, m_templatePosition.y - m_settings.TemplateSideLen);
        int maxY = std::min(m_templatePosition.y + m_settings.TemplateSideLen, m_settings.TrackingImageSideLen - 1);
        croppedImage = trackingImage(cv::Rect{ minX, minY, maxX - minX, maxY - minY });
    }

    cv::matchTemplate(croppedImage, m_originalTemplate, matchResult, cv::TemplateMatchModes::TM_CCORR_NORMED);
    double maxValueOriginal;
    cv::Point maxLocOriginal{};
    cv::minMaxLoc(matchResult, nullptr, &maxValueOriginal, nullptr, &maxLocOriginal);

    cv::matchTemplate(croppedImage, m_recentTemplate, matchResult, cv::TemplateMatchModes::TM_CCORR_NORMED);
    double maxValueRecent;
    cv::Point maxLocRecent{};
    cv::minMaxLoc(matchResult, nullptr, &maxValueRecent, nullptr, &maxLocRecent);

    double maxValue;
    cv::Point maxLoc{};
    if (m_settings.RecentTemplateProbabilityPenalizingFactor * maxValueRecent < maxValueOriginal)
    {
        maxValue = maxValueOriginal;
        maxLoc = maxLocOriginal;
    }
    else
    {
        maxValue = m_settings.RecentTemplateProbabilityPenalizingFactor * maxValueRecent;
        maxLoc = maxLocRecent;
    }

    if (maxValue > m_settings.MinimumTemplateMatchScore)
    {
        updateMostRecentTemplate({
            maxLoc.x + m_settings.TemplateSideLen / 2 + minX,
            maxLoc.y + m_settings.TemplateSideLen / 2 + minY
            });

        return true;
    }
    else
    {
        m_templatePosition = cv::Point2i{};
        m_recentTemplate = cv::Mat{};

        return false;
    }
}

cv::Point2i ImageTemplateTracker::GetTemplatePosition() const
{
    return trackingSpaceToImageSpace(m_templatePosition);
}

cv::Rect ImageTemplateTracker::GetTemplateRect() const
{
    int halfTemplateSideLen = m_settings.TemplateSideLen / 2;
    auto minPt = trackingSpaceToImageSpace(m_templatePosition - cv::Point2i{ halfTemplateSideLen, halfTemplateSideLen });
    auto maxPt = trackingSpaceToImageSpace(m_templatePosition + cv::Point2i{ halfTemplateSideLen, halfTemplateSideLen });
    return cv::Rect{ minPt, maxPt };
}

void ImageTemplateTracker::updateTrackingImage(const cv::Mat& image)
{
    cv::cvtColor(image, greyscaleImage, CV_RGB2GRAY);
    cv::resize(greyscaleImage, trackingImage, { m_settings.TrackingImageSideLen, m_settings.TrackingImageSideLen });
}

void ImageTemplateTracker::updateMostRecentTemplate(const cv::Point2i& trackingSpaceTemplatePosition)
{
    m_templatePosition = trackingSpaceTemplatePosition;

    int halfTemplateSideLen = m_settings.TemplateSideLen / 2;
    m_recentTemplate = trackingImage(cv::Rect{
        m_templatePosition.x - halfTemplateSideLen,
        m_templatePosition.y - halfTemplateSideLen,
        m_settings.TemplateSideLen,
        m_settings.TemplateSideLen
        }).clone();
}

cv::Point2i ImageTemplateTracker::imageSpaceToTrackingSpace(const cv::Point2i& pt) const
{
    int x = pt.x * m_settings.TrackingImageSideLen / greyscaleImage.size().width;
    int y = pt.y * m_settings.TrackingImageSideLen / greyscaleImage.size().height;

    int minVal = m_settings.TemplateSideLen / 2;
    int maxVal = m_settings.TrackingImageSideLen - minVal;
    x = std::max(minVal, std::min(x, maxVal));
    y = std::max(minVal, std::min(y, maxVal));

    return { x, y };
}

cv::Point2i ImageTemplateTracker::trackingSpaceToImageSpace(const cv::Point2i& pt) const
{
    return { pt.x * greyscaleImage.size().width / m_settings.TrackingImageSideLen,
        pt.y * greyscaleImage.size().height / m_settings.TrackingImageSideLen };
}
