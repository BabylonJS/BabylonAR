#include "ArUcoTracker.h"

#include <opencv2/aruco.hpp>
#include <opencv2/opencv.hpp>

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

    std::map<int, TrackedMarker> ProcessImage(size_t width, size_t height, void *data, float markerScale)
    {
        cv::Mat image{};
        cv::resize(cv::Mat(height, width, CV_8UC4, data), image, m_frameSize);
        cv::cvtColor(image, image, cv::COLOR_RGBA2GRAY);

        m_markerIds.clear();
        m_markerCorners.clear();
        m_rotationVectors.clear();
        m_translationVectors.clear();

        cv::aruco::detectMarkers(image, m_markerDictionary, m_markerCorners, m_markerIds);
        cv::aruco::estimatePoseSingleMarkers(m_markerCorners, markerScale, m_cameraMatrix, m_distortionCoefficients, m_rotationVectors, m_translationVectors);

        std::map<int, TrackedMarker> markers;

        for (size_t idx = 0; idx < m_markerIds.size(); idx++)
        {
            auto& marker = markers[m_markerIds[idx]] = {
                cv::Point3f{ 
                    static_cast<float>(m_translationVectors[idx][0]), 
                    static_cast<float>(m_translationVectors[idx][1]), 
                    static_cast<float>(m_translationVectors[idx][2]) }, 
                cv::Matx33f{}
            };
            cv::Vec3f rodrigues{ 
                static_cast<float>(m_rotationVectors[idx][0]), 
                static_cast<float>(m_rotationVectors[idx][1]), 
                static_cast<float>(m_rotationVectors[idx][2]) };
            cv::Rodrigues(rodrigues, marker.Rotation);
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

std::map<int, ArUcoTracker::TrackedMarker> ArUcoTracker::ProcessImage(size_t width, size_t height, void *data, float markerScale)
{
    return std::move(m_impl->ProcessImage(width, height, data, markerScale));
}