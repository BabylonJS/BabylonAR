#include "ArucoTracker.h"

#include <opencv2/aruco.hpp>
#include <opencv2/opencv.hpp>

struct ArucoTracker::Impl
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

        m_distortionCoefficients = cv::Mat{ 1, 8, CV_64F };
        m_distortionCoefficients.at<double>(0, 0) = k1;
        m_distortionCoefficients.at<double>(0, 1) = k2;
        m_distortionCoefficients.at<double>(0, 2) = p1;
        m_distortionCoefficients.at<double>(0, 3) = p2;
        m_distortionCoefficients.at<double>(0, 4) = k3;
        m_distortionCoefficients.at<double>(0, 5) = 0.0;
        m_distortionCoefficients.at<double>(0, 6) = 0.0;
        m_distortionCoefficients.at<double>(0, 7) = 0.0;
    }

    std::vector<TrackedMarker> ProcessImage(size_t width, size_t height, void *data, float markerScale)
    {
        cv::Mat image{};
        cv::resize(cv::Mat(height, width, CV_8UC4, data), image, m_frameSize);
        cv::cvtColor(image, image, CV_RGBA2GRAY);

        m_markerIds.clear();
        m_markerCorners.clear();
        m_rotationVectors.clear();
        m_translationVectors.clear();

        cv::aruco::detectMarkers(image, m_markerDictionary, m_markerCorners, m_markerIds);
        cv::aruco::estimatePoseSingleMarkers(m_markerCorners, markerScale, m_cameraMatrix, m_distortionCoefficients, m_rotationVectors, m_translationVectors);

        std::vector<TrackedMarker> markers;
        markers.reserve(m_markerIds.size());

        for (size_t idx = 0; idx < m_markerIds.size(); idx++)
        {
            markers.emplace_back(
                m_markerIds[idx],
                std::array<double, 3>{ m_translationVectors[idx][0], m_translationVectors[idx][1], m_translationVectors[idx][2] },
                std::array<double, 3>{ m_rotationVectors[idx][0], m_rotationVectors[idx][1], m_rotationVectors[idx][2] }
            );
        }

        return std::move(markers);
    }

private:
    cv::Mat m_cameraMatrix{};
    cv::Mat m_distortionCoefficients{};
    cv::Size m_frameSize{};
    cv::Ptr<cv::aruco::Dictionary> m_markerDictionary;

    // Cached vectors to try to minimize allocations.
    std::vector<int> m_markerIds{};
    std::vector<std::vector<cv::Point2f>> m_markerCorners{};
    std::vector<cv::Vec3d> m_rotationVectors{};
    std::vector<cv::Vec3d> m_translationVectors{};
};

ArucoTracker::ArucoTracker()
    : m_impl{ std::make_unique<Impl>() }
{}

ArucoTracker::~ArucoTracker() {}

void ArucoTracker::SetCalibrationFromFrameSize(size_t frameWidth, size_t frameHeight)
{
    m_impl->SetCalibrationFromFrameSize(frameWidth, frameHeight);
}

void ArucoTracker::SetCalibration(size_t frameWidth, size_t frameHeight, double fx, double fy, double cx, double cy, double k1, double k2, double p1, double p2, double k3)
{
    m_impl->SetCalibration(frameWidth, frameHeight, fx, fy, cx, cy, k1, k2, p1, p2, k3);
}

std::vector<ArucoTracker::TrackedMarker> ArucoTracker::ProcessImage(size_t width, size_t height, void *data, float markerScale)
{
    return m_impl->ProcessImage(width, height, data, markerScale);
}