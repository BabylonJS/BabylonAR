#include "ImageTemplateTracker.h"

#include <memory>

extern "C"
{
    void initialize(int width, int height, void* data, int template_center_x, int template_center_y);
    void uninitialize();
    void track_template_in_image(int width, int height, void* data);

    // Callback to JavaScript
    extern void update_template_position(int x, int y);
}

std::unique_ptr<ImageTemplateTracker> imageTemplateTracker{};

void initialize(int width, int height, void* data, int template_center_x, int template_center_y)
{
    cv::Mat image{ height, width, CV_8UC4, data };
    imageTemplateTracker = std::make_unique<ImageTemplateTracker>(
        image, 
        cv::Point2i{ template_center_x, template_center_y },
        ImageTemplateTracker::Settings{});
}

void uninitialize()
{
    imageTemplateTracker.reset();
}

void track_template_in_image(int width, int height, void* data)
{
    cv::Mat image{ height, width, CV_8UC4, data };
    if(imageTemplateTracker->TrackTemplateInImage(image))
    {
        auto pt = imageTemplateTracker->GetTemplatePosition();
        update_template_position(pt.x, pt.y);
    }
}
