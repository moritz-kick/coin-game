import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/autoplay';
import { Autoplay } from 'swiper/modules';

const ImageSwiper = ({ images = [], autoplay = true, delay = 4000, speed = 300 }) => {
  return (
    <Swiper
      spaceBetween={50}
      slidesPerView={1}
      autoplay={autoplay ? { delay: delay } : false}
      modules={[Autoplay]}
      loop={true}
      speed={speed}
    >
      {images.map((image, index) => (
        <SwiperSlide key={index}>
          <img src={image.src} alt={image.alt || `Slide ${index + 1}`} className="w-full h-auto" />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default ImageSwiper;
