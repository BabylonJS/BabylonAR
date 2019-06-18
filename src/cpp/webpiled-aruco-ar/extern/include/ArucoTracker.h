#pragma once

#include <array>
#include <memory>
#include <vector>

class ArucoTracker
{
public:
    typedef std::array<double, 3> Point3d;

    struct TrackedMarker
    {
        TrackedMarker(int id, const Point3d& position, const Point3d& rotation)
            : Id{ id }
            , Position{ position }
            , Rotation{ rotation }
        {}

        int Id{};
        Point3d Position{};
        Point3d Rotation{};
    };;

    ArucoTracker();
    ~ArucoTracker();

    void SetCalibrationFromFrameSize(size_t frameWidth, size_t frameHeight);
    void SetCalibration(size_t frameWidth, size_t frameHeight, double fx, double fy, double cx, double cy, double k1, double k2, double p1, double p2, double k3);
    std::vector<TrackedMarker> ProcessImage(size_t width, size_t height, void *data, float markerScale);

private:
    struct Impl;
    std::unique_ptr<Impl> m_impl{};
};