#include <ArucoTracker.h>

#include <memory>
#include <vector>

extern "C"
{
    void initialize();
    void uninitialize();
    void reset();
    void set_calibration_from_frame_size(int frameWidth, int frameHeight);
    void set_calibration(int frameWidth, int frameHeight, float fx, float fy, float cx, float cy, float k1, float k2, float p1, float p2, float k3);
    int process_image(int width, int height, void* data, float markerScale);
    ArucoTracker::TrackedMarker* get_tracked_marker(int idx);
}

// Global calibration solver variable
std::unique_ptr<ArucoTracker> arucoTracker{};
std::vector<ArucoTracker::TrackedMarker> trackedMarkers{};

void initialize()
{
    arucoTracker = std::make_unique<ArucoTracker>();
}

void uninitialize()
{
    arucoTracker.reset();
    trackedMarkers.clear();
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

int process_image(int width, int height, void* data, float markerScale)
{
    trackedMarkers = arucoTracker->ProcessImage(
        static_cast<size_t>(width),
        static_cast<size_t>(height),
        data,
        markerScale
    );

    return static_cast<size_t>(trackedMarkers.size());
}

ArucoTracker::TrackedMarker* get_tracked_marker(int idx)
{
    return &trackedMarkers[idx];
}