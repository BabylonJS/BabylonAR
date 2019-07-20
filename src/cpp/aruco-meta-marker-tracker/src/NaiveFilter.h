#pragma once

// This implementation "inspired" by a questionable interpretation of a Kalman Filter.
template<typename PointT>
class NaiveFilter
{
public:
    NaiveFilter(PointT initialEstimate, double lambda)
        : m_lastEstimate{ initialEstimate }
        , m_lambda{ lambda }
    {}

    void Update(PointT& measurement, double deltaT)
    {
        auto measurementDelta = measurement - m_lastEstimate;
        double measurementError = measurementDelta.dot(measurementDelta);

        double gain = (m_lastEstimateError + EPSILON) / (m_lastEstimateError + measurementError + EPSILON);

        m_lastEstimate += gain * measurementDelta;
        m_lastEstimateError = std::max((1.f - gain) * m_lastEstimateError, m_lambda * deltaT * measurementError);

        measurement = m_lastEstimate;
    }

private:
    static constexpr double EPSILON = 0.00001; // To prevent gain from becoming NaN.
    const double m_lambda{};

    PointT m_lastEstimate{};
    double m_lastEstimateError{ 10.f };
};