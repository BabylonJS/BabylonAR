#include "ArUcoTracker.h"
#include "NaiveFilter.h"
#include "Quaternion.h"

#include <opencv2/opencv.hpp>

namespace
{
    struct ArUcoMetaMarker
    {
        const int Id{};
        const int UpperLeftId{};
        const int UpperRightId{};
        const int LowerLeftId{};
        const int LowerRightId{};
        const float WidthInMarkers{};

        NaiveFilter<cv::Point3f> PositionFilter;
        NaiveFilter<cv::Vec3f> RightVectorFilter;
        NaiveFilter<cv::Vec3f> ForwardVectorFilter;

        float TrackingConfidence{};
        cv::Point3f Position{ 0.f, 0.f, 0.f };
        Quaternion Rotation{ 0.f, 0.f, 0.f, 1.f };

        ArUcoMetaMarker(int upperLeftId, int upperRightId, int lowerLeftId, int lowerRightId, float widthInMarkers)
            : Id{ ++lastId }
            , UpperLeftId{ upperLeftId }
            , UpperRightId{ upperRightId }
            , LowerLeftId{ lowerLeftId }
            , LowerRightId{ lowerRightId }
            , WidthInMarkers{ widthInMarkers }
            , PositionFilter{ 0.5f }
            , RightVectorFilter{ 0.15f }
            , ForwardVectorFilter{ 0.15f }
        {}

    private:
        static int lastId;
    };
    int ArUcoMetaMarker::lastId = 0;

    template<typename T>
    inline float distanceSquared(const T& u, const T& v)
    {
        auto delta = u - v;
        return delta.dot(delta);
    }

    void updateMetaMarkerFromTrackedMarkers(ArUcoMetaMarker& metaMarker, const std::map<int, ArUcoTracker::TrackedMarker>& trackedMarkers, std::array<bool, 50>& trackedMarkerIds)
    {
        std::array<const ArUcoTracker::TrackedMarker*, 4> markerPtrs
        {
            trackedMarkerIds[metaMarker.UpperLeftId] ? &trackedMarkers.at(metaMarker.UpperLeftId) : nullptr,
            trackedMarkerIds[metaMarker.UpperRightId] ? &trackedMarkers.at(metaMarker.UpperRightId) : nullptr,
            trackedMarkerIds[metaMarker.LowerLeftId] ? &trackedMarkers.at(metaMarker.LowerLeftId) : nullptr,
            trackedMarkerIds[metaMarker.LowerRightId] ? &trackedMarkers.at(metaMarker.LowerRightId) : nullptr
        };

        std::array<cv::Point2f, 4> offsets
        {
            metaMarker.WidthInMarkers * cv::Point2f{ -0.5f, 0.5f },
            metaMarker.WidthInMarkers * cv::Point2f{ 0.5f, 0.5f },
            metaMarker.WidthInMarkers * cv::Point2f{ -0.5f, -0.5f },
            metaMarker.WidthInMarkers * cv::Point2f{ 0.5f, -0.5f }
        };

        float confidence = 0.f;
        cv::Point3f pos{};
        cv::Vec3f right{};
        cv::Vec3f up{};
        cv::Vec3f forward{};
        {
            int count = 0;
            for (int idx = 0; idx < markerPtrs.size(); ++idx)
            {
                auto tracked = markerPtrs[idx];
                if (tracked != nullptr)
                {
                    const cv::Vec3f localRight{
                        tracked->Rotation(0, 0),
                        tracked->Rotation(1, 0),
                        tracked->Rotation(2, 0)
                    };
                    const cv::Vec3f localForward{
                        tracked->Rotation(0, 2),
                        tracked->Rotation(1, 2),
                        tracked->Rotation(2, 2)
                    };

                    pos += (tracked->Position - cv::Point3f{ offsets[idx].x * localRight + offsets[idx].y * localForward });
                    ++count;

                    right += localRight;
                    forward += localForward;
                    
                    confidence += 0.25f;
                }
            }
            pos /= count;

            auto ul = markerPtrs[0];
            auto ur = markerPtrs[1];
            auto ll = markerPtrs[2];
            auto lr = markerPtrs[3];
            const float deducedRotationWeight = 2.f * 1.f / metaMarker.WidthInMarkers;
            const float distanceLeniency = 0.2f * metaMarker.WidthInMarkers;
            if (ul != nullptr && ur != nullptr && std::abs(distanceSquared(ul->Position, ur->Position) - metaMarker.WidthInMarkers) < distanceLeniency)
            {
                right += deducedRotationWeight * cv::Vec3f{
                    (ur->Position.x - ul->Position.x),
                    (ur->Position.y - ul->Position.y),
                    (ur->Position.z - ul->Position.z)
                };
            }
            if (ul != nullptr && ll != nullptr && std::abs(distanceSquared(ul->Position, ll->Position) - metaMarker.WidthInMarkers) < distanceLeniency)
            {
                forward += deducedRotationWeight * cv::Vec3f{
                    (ul->Position.x - ll->Position.x),
                    (ul->Position.y - ll->Position.y),
                    (ul->Position.z - ll->Position.z)
                };
            }
            if (ll != nullptr && lr != nullptr && std::abs(distanceSquared(ll->Position, lr->Position) - metaMarker.WidthInMarkers) < distanceLeniency)
            {
                right += deducedRotationWeight * cv::Vec3f{
                    (lr->Position.x - ll->Position.x),
                    (lr->Position.y - ll->Position.y),
                    (lr->Position.z - ll->Position.z)
                };
            }
            if (ur != nullptr && lr != nullptr && std::abs(distanceSquared(ur->Position, lr->Position) - metaMarker.WidthInMarkers) < distanceLeniency)
            {
                forward += deducedRotationWeight * cv::Vec3f{
                    (ur->Position.x - lr->Position.x),
                    (ur->Position.y - lr->Position.y),
                    (ur->Position.z - lr->Position.z)
                };
            }

            right /= right.dot(right);
            forward /= right.dot(right);
        }

        if (confidence > 0.3f)
        {
            metaMarker.PositionFilter.Update(pos);
            metaMarker.RightVectorFilter.Update(right);
            metaMarker.ForwardVectorFilter.Update(forward);
            
            right /= right.dot(right);
            forward /= right.dot(right);
            up = forward.cross(right);
            forward = right.cross(up);
        }
        
        if (confidence > 0.5f)
        {
            metaMarker.Position = pos;

            cv::Matx33f rotation {
                right[0], up[0], forward[0],
                right[1], up[1], forward[1],
                right[2], up[2], forward[2]
            };
            cv::Vec3f rodrigues{};
            cv::Rodrigues(rotation, rodrigues);
            metaMarker.Rotation = Quaternion{ rodrigues };

            metaMarker.TrackingConfidence = 1.f;
        }
        else
        {
            metaMarker.TrackingConfidence = 0.f;
        }
        
    }
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
std::vector<ArUcoMetaMarker> markers{};

void initialize()
{
    arucoTracker = std::make_unique<ArUcoTracker>();
}

void uninitialize()
{
    arucoTracker.reset();
    markers.clear();
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
    markers.emplace_back(ulId, urId, llId, lrId, widthInMarkers);
    return markers.back().Id;
}

void process_image(int width, int height, void* data)
{
    auto trackedMarkers = arucoTracker->ProcessImage(
        static_cast<size_t>(width),
        static_cast<size_t>(height),
        data,
        1.f);

    // WARNING: Takes a hard dependency on the marker dictionary used in ArUcoTracker.cpp. Should use 
    // an exposed constant value instead.
    std::array<bool, 50> trackedMarkerIds{};
    for (const auto& idToMarker : trackedMarkers)
    {
        const auto& marker = idToMarker.second;
        trackedMarkerIds[idToMarker.first] = true;
    }

    for (auto& marker : markers)
    {
        updateMetaMarkerFromTrackedMarkers(marker, trackedMarkers, trackedMarkerIds);
    }

    for (const auto& marker : markers)
    {
        update_marker_tracking(
            marker.Id,
            marker.TrackingConfidence,
            marker.Position.x,
            -1.f * marker.Position.y, // Handedness
            marker.Position.z,
            marker.Rotation.x,
            marker.Rotation.y,
            marker.Rotation.z,
            marker.Rotation.w);
    }
}