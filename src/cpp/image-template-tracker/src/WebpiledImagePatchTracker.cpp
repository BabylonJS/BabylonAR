#include <ImagePatchTracker.h>

#include <memory>

extern "C"
{
    void initialize(int width, int height, void* data, int template_center_x, int template_center_y);
    void uninitialize();
    void track_template_in_image(int width, int height, void* data);

    // Callback to JavaScript
    extern void update_template_position(int x, int y);
}

std::unique_ptr<ImagePatchTracker> imagePatchTracker{};

void initialize(int width, int height, void* data, int template_center_x, int template_center_y)
{
    cv::Mat image{ height, width, CV_8UC4, data };
    imagePatchTracker = std::make_unique<ImagePatchTracker>(
        image, 
        cv::Point2i{ template_center_x, template_center_y },
        ImagePatchTracker::Settings{});
}

void uninitialize()
{
    imagePatchTracker.reset();
}

void track_template_in_image(int width, int height, void* data)
{
    cv::Mat image{ height, width, CV_8UC4, data };
    if(imagePatchTracker->TrackPatchInImage(image))
    {
        auto pt = imagePatchTracker->GetPatchPosition();
        update_template_position(pt.x, pt.y);
    }
}
