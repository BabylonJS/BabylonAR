#include "ArUcoTracker.h"

#include <opencv2/aruco.hpp>
#include <opencv2/opencv.hpp>

namespace
{
    inline void addPointsAroundCenter(std::vector<cv::Point3f>& points, float x, float y, float markerSize = 1.f)
    {
        const float delta = 0.5f * markerSize;
        points.reserve(4);
        points.emplace_back(x - delta, y - delta, 0.f);
        points.emplace_back(x + delta, y - delta, 0.f);
        points.emplace_back(x + delta, y + delta, 0.f);
        points.emplace_back(x - delta, y + delta, 0.f);
    }
}

struct ArUcoTracker::Impl
{
    Impl()
        : m_markerDictionary{ cv::aruco::getPredefinedDictionary(cv::aruco::PREDEFINED_DICTIONARY_NAME::DICT_4X4_50) }
    {
        SetCalibrationFromFrameSize(320, 240);
    }

    void SetCalibrationFromFrameSize(size_t frameWidth, size_t frameHeight)
    {
        SetCalibration(
            frameWidth,
            frameHeight,
            355.0 * frameWidth / 320.0,
            355.0 * frameHeight / 240.0,
            frameWidth / 2.0,
            frameHeight / 2.0,
            0.0, 0.0, 0.0, 0.0, 0.0);
    }

    void SetCalibration(size_t frameWidth, size_t frameHeight, double fx, double fy, double cx, double cy, double k1, double k2, double p1, double p2, double k3)
    {
        m_frameSize.width = frameWidth;
        m_frameSize.height = frameHeight;

        m_cameraMatrix = cv::Mat::eye({ 3, 3 }, CV_64F);
        m_cameraMatrix.at<double>(0, 0) = fx;
        m_cameraMatrix.at<double>(1, 1) = fy;
        m_cameraMatrix.at<double>(0, 2) = cx;
        m_cameraMatrix.at<double>(1, 2) = cy;

        m_distortionCoefficients = cv::Mat(1, 8, CV_64F);
        m_distortionCoefficients.at<double>(0, 0) = k1;
        m_distortionCoefficients.at<double>(0, 1) = k2;
        m_distortionCoefficients.at<double>(0, 2) = p1;
        m_distortionCoefficients.at<double>(0, 3) = p2;
        m_distortionCoefficients.at<double>(0, 4) = k3;
        m_distortionCoefficients.at<double>(0, 5) = 0.0;
        m_distortionCoefficients.at<double>(0, 6) = 0.0;
        m_distortionCoefficients.at<double>(0, 7) = 0.0;
    }

    int AddMetaMarker(int upperLeftId, int upperRightId, int lowerLeftId, int lowerRightId, float widthInMarkers)
    {
        std::vector<std::vector<cv::Point3f>> markerCorners{};
        markerCorners.resize(4);
        const float halfWidth = widthInMarkers / 2.f;
        addPointsAroundCenter(markerCorners[0], -halfWidth, -halfWidth);
        addPointsAroundCenter(markerCorners[1], -halfWidth, halfWidth);
        addPointsAroundCenter(markerCorners[2], halfWidth, -halfWidth);
        addPointsAroundCenter(markerCorners[3], halfWidth, halfWidth);

        std::vector<int> ids{};
        ids.reserve(4);
        ids.push_back(upperLeftId);
        ids.push_back(upperRightId);
        ids.push_back(lowerLeftId);
        ids.push_back(lowerRightId);

        m_boards.push_back(cv::aruco::Board::create(markerCorners, m_markerDictionary, ids));
        m_metaMarkers.emplace_back();

        return m_metaMarkers.size() - 1;
    }

    const MetaMarker& GetMetaMarker(int id) const
    {
        return m_metaMarkers[id];
    }

    const std::vector<MetaMarker>& ProcessImage(size_t width, size_t height, void *data)
    {
        cv::Mat image{};
        cv::resize(cv::Mat(height, width, CV_8UC4, data), image, m_frameSize);
        cv::cvtColor(image, image, cv::COLOR_RGBA2GRAY);

        m_markerIds.clear();
        m_markerCorners.clear();

        cv::aruco::detectMarkers(image, m_markerDictionary, m_markerCorners, m_markerIds);

        for (size_t idx = 0; idx < m_boards.size(); ++idx)
        {
            const auto& board = m_boards[idx];
            auto& marker = m_metaMarkers[idx];

            // Early out for deleted meta markers.
            if (!marker.ShouldTrack)
            {
                continue;
            }

            const int poseEstimationResult = cv::aruco::estimatePoseBoard(
                m_markerCorners, 
                m_markerIds, 
                board, 
                m_cameraMatrix, 
                m_distortionCoefficients, 
                marker.Rotation, 
                marker.Position, 
                marker.IsTracked());
            
            if (poseEstimationResult == 4 || (poseEstimationResult > 2 && marker.IsTracked()))
            {
                marker.MissedFrames = 0;
            }
            else
            {
                ++marker.MissedFrames;
            }
        }

        return m_metaMarkers;
    }

private:
    cv::Mat m_cameraMatrix{};
    cv::Mat m_distortionCoefficients{};
    cv::Size m_frameSize{};
    cv::Ptr<cv::aruco::Dictionary> m_markerDictionary{};

    // Cached vectors to try to minimize allocations.
    std::vector<int> m_markerIds{};
    std::vector<std::vector<cv::Point2f>> m_markerCorners{};

    std::vector<cv::Ptr<cv::aruco::Board>> m_boards{};
    std::vector<MetaMarker> m_metaMarkers{};
};

ArUcoTracker::ArUcoTracker()
    : m_impl{ std::make_unique<Impl>() }
{}

ArUcoTracker::~ArUcoTracker() {}

void ArUcoTracker::SetCalibrationFromFrameSize(size_t frameWidth, size_t frameHeight)
{
    m_impl->SetCalibrationFromFrameSize(frameWidth, frameHeight);
}

void ArUcoTracker::SetCalibration(size_t frameWidth, size_t frameHeight, double fx, double fy, double cx, double cy, double k1, double k2, double p1, double p2, double k3)
{
    m_impl->SetCalibration(frameWidth, frameHeight, fx, fy, cx, cy, k1, k2, p1, p2, k3);
}

int ArUcoTracker::AddMetaMarker(int upperLeftId, int upperRightId, int lowerLeftId, int lowerRightId, float widthInMarkers)
{
    return m_impl->AddMetaMarker(upperLeftId, upperRightId, lowerLeftId, lowerRightId, widthInMarkers);
}

const std::vector<ArUcoTracker::MetaMarker>& ArUcoTracker::ProcessImage(size_t width, size_t height, void *data)
{
    return m_impl->ProcessImage(width, height, data);
}