#include "ArUcoTracker.h"
#include "NaiveFilter.h"
#include "Quaternion.h"

#include <opencv2/opencv.hpp>

extern "C"
{
    // Boilerplate
    void initialize();
    void uninitialize();
    void reset();
    void set_calibration_from_frame_size(int frameWidth, int frameHeight);
    void set_calibration(int frameWidth, int frameHeight, float fx, float fy, float cx, float cy, float k1, float k2, float p1, float p2, float k3);

    // Real API
    int add_marker(int ulId, int urId, int llId, int lrId, float widthInMarkers);
    void process_image(int width, int height, void* data);

    // Callback to JavaScript
    extern void update_marker_tracking(int id, float confidence, float px, float py, float pz, float rx, float ry, float rz, float rw);
}

// Global calibration solver variable
std::unique_ptr<ArUcoTracker> arucoTracker{};

void initialize()
{
    arucoTracker = std::make_unique<ArUcoTracker>();
}

void uninitialize()
{
    arucoTracker.reset();
}

void reset()
{
    uninitialize();
    initialize();
}

void set_calibration_from_frame_size(int frameWidth, int frameHeight)
{
    arucoTracker->SetCalibrationFromFrameSize(static_cast<size_t>(frameWidth), static_cast<size_t>(frameHeight));
}

void set_calibration(int frameWidth, int frameHeight, float fx, float fy, float cx, float cy, float k1, float k2, float p1, float p2, float k3)
{
    arucoTracker->SetCalibration(
        static_cast<size_t>(frameWidth),
        static_cast<size_t>(frameHeight),
        static_cast<double>(fx),
        static_cast<double>(fy),
        static_cast<double>(cx),
        static_cast<double>(cy),
        static_cast<double>(k1),
        static_cast<double>(k2),
        static_cast<double>(p1),
        static_cast<double>(p2),
        static_cast<double>(k3)
    );
}

int add_marker(int ulId, int urId, int llId, int lrId, float widthInMarkers)
{
    return arucoTracker->AddMetaMarker(ulId, urId, llId, lrId, widthInMarkers);
}

void process_image(int width, int height, void* data)
{
    const auto& markers = arucoTracker->ProcessImage(static_cast<size_t>(width), static_cast<size_t>(height), data);
    
    for (size_t idx = 0; idx < markers.size(); ++idx)
    {
        const auto& marker = markers[idx];

        Quaternion q{ marker.Rotation };
        float confidence = std::powf(0.5f, marker.MissedFrames);
        update_marker_tracking(
            idx,
            confidence,
            marker.Position[0],
            -1.f * marker.Position[1], // Handedness
            marker.Position[2],
            q.x,
            q.y,
            q.z,
            q.w);
    }
}