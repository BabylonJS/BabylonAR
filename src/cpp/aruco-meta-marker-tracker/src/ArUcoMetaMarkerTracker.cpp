#include "ArUcoTracker.h"
#include "NaiveFilter.h"
#include "Quaternion.h"

#include <opencv2/opencv.hpp>

namespace
{
    struct FilteredPose
    {
        cv::Point3d Position{ 0, 0, 0 };
        Quaternion Rotation{ 0, 0, 0, 1 };
        double Confidence = 0;

        void Update(const ArUcoTracker::MetaMarker& marker)
        {
            Confidence = 0.5 * Confidence + 0.5 * std::pow(0.5, marker.MissedFrames);
            if (Confidence < 0.9)
            {
                return;
            }
            double deltaT = marker.MissedFrames + 1;

            const cv::Vec3d& position = marker.Position;
            cv::Vec3d rotation = marker.Rotation;

            Position.x = position[0];
            Position.y = -position[1]; // Handedness
            Position.z = position[2];
            m_positionFilter.Update(Position, deltaT);

            cv::Matx33d matrix{};
            cv::Rodrigues(rotation, matrix);

            cv::Vec3d right{
                matrix(0, 0),
                matrix(1, 0),
                matrix(2, 0)
            };
            m_rightFilter.Update(right, deltaT);
            right /= right.dot(right);

            cv::Vec3d forward{
                matrix(0, 2),
                matrix(1, 2),
                matrix(2, 2)
            };
            m_forwardFilter.Update(forward, deltaT);
            forward /= forward.dot(forward);

            cv::Vec3d up = forward.cross(right);
            forward = right.cross(up);
            
            matrix = {
                right[0], up[0], forward[0],
                right[1], up[1], forward[1],
                right[2], up[2], forward[2]
            };

            cv::Rodrigues(matrix, rotation);
            Rotation = { rotation };
        }

    private:
        NaiveFilter<cv::Point3d> m_positionFilter{ { 0, 0, 0 }, 10 };
        NaiveFilter<cv::Vec3d> m_rightFilter{ { 1, 0, 0 }, 2 };
        NaiveFilter<cv::Vec3d> m_forwardFilter{ { 0, 0, 1 }, 2 };
    };
}

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
std::vector<FilteredPose> poses{};

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
    poses.emplace_back();
    return arucoTracker->AddMetaMarker(ulId, urId, llId, lrId, widthInMarkers);
}

void process_image(int width, int height, void* data)
{
    const auto& markers = arucoTracker->ProcessImage(static_cast<size_t>(width), static_cast<size_t>(height), data);
    
    for (size_t idx = 0; idx < markers.size(); ++idx)
    {
        const auto& marker = markers[idx];
        auto& pose = poses[idx];

        pose.Update(marker);
        
        update_marker_tracking(
            idx,
            static_cast<float>(pose.Confidence),
            static_cast<float>(pose.Position.x),
            static_cast<float>(pose.Position.y),
            static_cast<float>(pose.Position.z),
            static_cast<float>(pose.Rotation.x),
            static_cast<float>(pose.Rotation.y),
            static_cast<float>(pose.Rotation.z),
            static_cast<float>(pose.Rotation.w));
    }
}