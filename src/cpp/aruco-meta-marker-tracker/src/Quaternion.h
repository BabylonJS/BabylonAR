#pragma once

#include <opencv2/opencv.hpp>

struct Quaternion
{
    double w;
    double x;
    double y;
    double z;

    // For reasons that will forever baffle me, w-last ordering is preferred by software engineers while 
    // true alphabetical ordering is preferred by mathematicians.
    Quaternion(double x, double y, double z, double w)
        : w{ w }
        , x{ x }
        , y{ y }
        , z{ z }
    {}

    template<typename PointT>
    Quaternion(const PointT& rodriguesPt)
    {
        cv::Point3d rodrigues{ rodriguesPt[0], rodriguesPt[1], rodriguesPt[2] };

        double theta = std::sqrt(rodrigues.dot(rodrigues));
        cv::Point3d axis{ -rodrigues.x, rodrigues.y, -rodrigues.z };
        assert(theta > 0.0001);
        axis /= theta;
        axis *= std::sin(theta / 2.0);

        w = std::cos(theta / 2.0);
        x = axis.x;
        y = axis.y;
        z = axis.z;
    }

    // http://fabiensanglard.net/doom3_documentation/37726-293748.pdf
    cv::Matx44f GetTransformMatrix(float tx = 0.f, float ty = 0.f, float tz = 0.f)
    {
        const double m00 = 1 - 2 * y * y - 2 * z * z;       const double m01 = 2 * x * y + 2 * w * z;           const double m02 = 2 * x * z - 2 * w * y;
        const double m10 = 2 * x * y - 2 * w * z;           const double m11 = 1 - 2 * x * x - 2 * z * z;       const double m12 = 2 * y * z + 2 * w * x;
        const double m20 = 2 * x * z + 2 * w * y;           const double m21 = 2 * y * z - 2 * w * x;           const double m22 = 1 - 2 * x * x - 2 * y * y;

        return{
            static_cast<float>(m00), static_cast<float>(m01), static_cast<float>(m02), tx,
            static_cast<float>(m10), static_cast<float>(m11), static_cast<float>(m12), ty,
            static_cast<float>(m20), static_cast<float>(m21), static_cast<float>(m22), tz,
            0.f,                     0.f,                     0.f,                     1.f
        };
    }
};