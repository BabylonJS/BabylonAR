#pragma once

#include <opencv2/opencv.hpp>

class ImagePatchTracker
{
public:
    struct Settings
    {
        int PatchSideLen = 16;
        int TrackingImageSideLen = 128;
        double RecentPatchProbabilityPenalizingFactor = 0.8;
        double MinimumPatchMatchScore = 0.98;
    };

    ImagePatchTracker(const cv::Mat& image, const cv::Point2i& patchPosition, Settings settings);
    bool TrackPatchInImage(const cv::Mat& image);
    cv::Point2i GetPatchPosition() const;
    cv::Rect GetPatchRect() const;

private:
    cv::Mat m_originalPatch{};
    cv::Mat m_recentPatch{};
    cv::Point2i m_patchPosition{};
    Settings m_settings{};

    // Scratch variables.
    cv::Mat greyscaleImage{};
    cv::Mat trackingImage{};
    cv::Mat croppedImage{};
    cv::Mat matchResult{};

    void updateTrackingImage(const cv::Mat& image);
    void updateMostRecentPatch(const cv::Point2i& trackingSpacePatchPosition);
    cv::Point2i imageSpaceToTrackingSpace(const cv::Point2i& pt) const;
    cv::Point2i trackingSpaceToImageSpace(const cv::Point2i& pt) const;
};