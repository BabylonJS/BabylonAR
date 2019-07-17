#pragma once

#include <array>
#include <map>
#include <memory>

#include <opencv2/opencv.hpp>

class ArUcoTracker
{
public:
    struct TrackedMarker
    {
        cv::Point3f Position{};
        cv::Matx33f Rotation{};
    };

    ArUcoTracker();
    ~ArUcoTracker();

    void SetCalibrationFromFrameSize(size_t frameWidth, size_t frameHeight);
    void SetCalibration(size_t frameWidth, size_t frameHeight, double fx, double fy, double cx, double cy, double k1, double k2, double p1, double p2, double k3);
    std::map<int, TrackedMarker> ProcessImage(size_t width, size_t height, void *data, float markerScale);

private:
    struct Impl;
    std::unique_ptr<Impl> m_impl{};
};