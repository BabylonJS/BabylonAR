#pragma once

#include <opencv2/opencv.hpp>

class ImageTemplateTracker
{
public:
    struct Settings
    {
        int TemplateSideLen = 16;
        int TrackingImageSideLen = 128;
        double RecentTemplateProbabilityPenalizingFactor = 0.8;
        double MinimumTemplateMatchScore = 0.98;
    };

    ImageTemplateTracker(const cv::Mat& image, const cv::Point2i& templatePosition, Settings settings);
    bool TrackTemplateInImage(const cv::Mat& image);
    cv::Point2i GetTemplatePosition() const;
    cv::Rect GetTemplateRect() const;

private:
    cv::Mat m_originalTemplate{};
    cv::Mat m_recentTemplate{};
    cv::Point2i m_templatePosition{};
    Settings m_settings{};

    // Scratch variables.
    cv::Mat greyscaleImage{};
    cv::Mat trackingImage{};
    cv::Mat croppedImage{};
    cv::Mat matchResult{};

    void updateTrackingImage(const cv::Mat& image);
    void updateMostRecentTemplate(const cv::Point2i& trackingSpaceTemplatePosition);
    cv::Point2i imageSpaceToTrackingSpace(const cv::Point2i& pt) const;
    cv::Point2i trackingSpaceToImageSpace(const cv::Point2i& pt) const;
};