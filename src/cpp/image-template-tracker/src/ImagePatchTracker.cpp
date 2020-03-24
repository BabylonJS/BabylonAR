#include "ImagePatchTracker.h"

ImagePatchTracker::ImagePatchTracker(const cv::Mat& image, const cv::Point2i& patchPosition, Settings settings)
    : m_settings{ settings }
{
    updateTrackingImage(image);
    updateMostRecentPatch(imageSpaceToTrackingSpace(patchPosition));
    m_originalPatch = m_recentPatch.clone();
}

bool ImagePatchTracker::TrackPatchInImage(const cv::Mat& image)
{
    updateTrackingImage(image);

    int minX;
    int minY;
    if (m_recentPatch.empty())
    {
        m_recentPatch = m_originalPatch;

        minX = 0;
        minY = 0;
        croppedImage = trackingImage;
    }
    else
    {
        minX = std::max(0, m_patchPosition.x - m_settings.PatchSideLen);
        int maxX = std::min(m_patchPosition.x + m_settings.PatchSideLen, m_settings.TrackingImageSideLen - 1);
        minY = std::max(0, m_patchPosition.y - m_settings.PatchSideLen);
        int maxY = std::min(m_patchPosition.y + m_settings.PatchSideLen, m_settings.TrackingImageSideLen - 1);
        croppedImage = trackingImage(cv::Rect{ minX, minY, maxX - minX, maxY - minY });
    }

    cv::matchTemplate(croppedImage, m_originalPatch, matchResult, cv::TemplateMatchModes::TM_CCORR_NORMED);
    double maxValueOriginal;
    cv::Point maxLocOriginal{};
    cv::minMaxLoc(matchResult, nullptr, &maxValueOriginal, nullptr, &maxLocOriginal);

    cv::matchTemplate(croppedImage, m_recentPatch, matchResult, cv::TemplateMatchModes::TM_CCORR_NORMED);
    double maxValueRecent;
    cv::Point maxLocRecent{};
    cv::minMaxLoc(matchResult, nullptr, &maxValueRecent, nullptr, &maxLocRecent);

    double maxValue;
    cv::Point maxLoc{};
    if (m_settings.RecentPatchProbabilityPenalizingFactor * maxValueRecent < maxValueOriginal)
    {
        maxValue = maxValueOriginal;
        maxLoc = maxLocOriginal;
    }
    else
    {
        maxValue = m_settings.RecentPatchProbabilityPenalizingFactor * maxValueRecent;
        maxLoc = maxLocRecent;
    }

    if (maxValue > m_settings.MinimumPatchMatchScore)
    {
        updateMostRecentPatch({
            maxLoc.x + m_settings.PatchSideLen / 2 + minX,
            maxLoc.y + m_settings.PatchSideLen / 2 + minY
            });

        return true;
    }
    else
    {
        m_patchPosition = cv::Point2i{};
        m_recentPatch = cv::Mat{};

        return false;
    }
}

cv::Point2i ImagePatchTracker::GetPatchPosition() const
{
    return trackingSpaceToImageSpace(m_patchPosition);
}

cv::Rect ImagePatchTracker::GetPatchRect() const
{
    int halfPatchSideLen = m_settings.PatchSideLen / 2;
    auto minPt = trackingSpaceToImageSpace(m_patchPosition - cv::Point2i{ halfPatchSideLen, halfPatchSideLen });
    auto maxPt = trackingSpaceToImageSpace(m_patchPosition + cv::Point2i{ halfPatchSideLen, halfPatchSideLen });
    return cv::Rect{ minPt, maxPt };
}

void ImagePatchTracker::updateTrackingImage(const cv::Mat& image)
{
    cv::cvtColor(image, greyscaleImage, CV_RGB2GRAY);
    cv::resize(greyscaleImage, trackingImage, { m_settings.TrackingImageSideLen, m_settings.TrackingImageSideLen });
}

void ImagePatchTracker::updateMostRecentPatch(const cv::Point2i& trackingSpacePatchPosition)
{
    m_patchPosition = trackingSpacePatchPosition;

    int halfPatchSideLen = m_settings.PatchSideLen / 2;
    m_recentPatch = trackingImage(cv::Rect{
        m_patchPosition.x - halfPatchSideLen,
        m_patchPosition.y - halfPatchSideLen,
        m_settings.PatchSideLen,
        m_settings.PatchSideLen
        }).clone();
}

cv::Point2i ImagePatchTracker::imageSpaceToTrackingSpace(const cv::Point2i& pt) const
{
    int x = pt.x * m_settings.TrackingImageSideLen / greyscaleImage.size().width;
    int y = pt.y * m_settings.TrackingImageSideLen / greyscaleImage.size().height;

    int minVal = m_settings.PatchSideLen / 2;
    int maxVal = m_settings.TrackingImageSideLen - minVal;
    x = std::max(minVal, std::min(x, maxVal));
    y = std::max(minVal, std::min(y, maxVal));

    return { x, y };
}

cv::Point2i ImagePatchTracker::trackingSpaceToImageSpace(const cv::Point2i& pt) const
{
    return { pt.x * greyscaleImage.size().width / m_settings.TrackingImageSideLen,
        pt.y * greyscaleImage.size().height / m_settings.TrackingImageSideLen };
}