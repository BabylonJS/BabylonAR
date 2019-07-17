#pragma once

// This implementation "inspired" by a questionable interpretation of a Kalman Filter.
template<typename PointT>
class NaiveFilter
{
public:
    NaiveFilter(float lambda)
        : m_lambda{ lambda }
    {}

    void Update(PointT& measurement)
    {
        auto measurementDelta = measurement - m_lastEstimate;
        float measurementError = measurementDelta.dot(measurementDelta);

        float gain = m_lastEstimateError / (m_lastEstimateError + measurementError);

        m_lastEstimate += gain * measurementDelta;
        m_lastEstimateError = std::max((1.f - gain) * m_lastEstimateError, m_lambda * measurementError);

        measurement = m_lastEstimate;
    }

private:
    const float m_lambda{};

    PointT m_lastEstimate{};
    float m_lastEstimateError{ 10.f };
};