#pragma once

#include <array>
#include <map>
#include <memory>

#include <opencv2/opencv.hpp>

class ArUcoTracker
{
    struct Impl;

public:
    struct MetaMarker
    {
        cv::Vec3d Position{ 0.0, 0.0, 0.0 };
        cv::Vec3d Rotation{};
        int MissedFrames{ 0xFFFF };

        MetaMarker()
        {
            cv::Rodrigues(cv::Matx33d::eye(), Rotation);
        }

        bool IsTracked() const
        {
            return MissedFrames == 0;
        }

    private:
        friend struct ArUcoTracker::Impl;
        bool ShouldTrack{ true };
    };

    ArUcoTracker();
    ~ArUcoTracker();

    void SetCalibrationFromFrameSize(size_t frameWidth, size_t frameHeight);
    void SetCalibration(size_t frameWidth, size_t frameHeight, double fx, double fy, double cx, double cy, double k1, double k2, double p1, double p2, double k3);

    int AddMetaMarker(int upperLeftId, int upperRightId, int lowerLeftId, int lowerRightId, float widthInMarkers);

    const std::vector<MetaMarker>& ProcessImage(size_t width, size_t height, void *data);

private:
    std::unique_ptr<Impl> m_impl{};
};