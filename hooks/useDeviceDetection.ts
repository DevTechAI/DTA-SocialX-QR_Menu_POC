'use client';

import { useState, useEffect } from 'react';

export interface DeviceInfo {
  deviceName: string;
  deviceType: 'iphone' | 'android' | 'ipad' | 'desktop' | 'unknown';
  model?: string;
  brand?: string;
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    deviceName: 'Unknown',
    deviceType: 'unknown',
    screenWidth: 0,
    screenHeight: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let deviceName = 'Unknown';
    let deviceType: DeviceInfo['deviceType'] = 'unknown';
    let model: string | undefined;
    let brand: string | undefined;
    let isMobile = false;
    let isTablet = false;
    let isDesktop = false;

    // Detect iPhone
    if (/iPhone/.test(userAgent) && !(window as any).MSStream) {
      deviceType = 'iphone';
      isMobile = true;
      brand = 'Apple';
      
      // Detect iPhone model
      if (/iPhone OS 17_/.test(userAgent) || /iPhone OS 18_/.test(userAgent)) {
        model = 'iPhone 15/16 Series';
      } else if (/iPhone OS 16_/.test(userAgent)) {
        model = 'iPhone 14 Series';
      } else if (/iPhone OS 15_/.test(userAgent)) {
        model = 'iPhone 13 Series';
      } else if (/iPhone OS 14_/.test(userAgent)) {
        model = 'iPhone 12 Series';
      } else {
        model = 'iPhone';
      }
      
      // More specific detection based on screen size
      if (screenWidth === 390 && screenHeight === 844) {
        model = 'iPhone 12/13/14';
        deviceName = 'iPhone 12/13/14';
      } else if (screenWidth === 393 && screenHeight === 852) {
        model = 'iPhone 14 Pro';
        deviceName = 'iPhone 14 Pro';
      } else if (screenWidth === 428 && screenHeight === 926) {
        model = 'iPhone 14 Pro Max';
        deviceName = 'iPhone 14 Pro Max';
      } else if (screenWidth === 375 && screenHeight === 667) {
        model = 'iPhone SE/6/7/8';
        deviceName = 'iPhone SE/6/7/8';
      } else if (screenWidth === 414 && screenHeight === 896) {
        model = 'iPhone 11/XR';
        deviceName = 'iPhone 11/XR';
      } else {
        deviceName = `iPhone (${screenWidth}x${screenHeight})`;
      }
    }
    // Detect iPad
    else if (/iPad/.test(userAgent) || (/Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1)) {
      deviceType = 'ipad';
      isTablet = true;
      brand = 'Apple';
      deviceName = 'iPad';
      model = 'iPad';
    }
    // Detect Android
    else if (/android/i.test(userAgent)) {
      deviceType = 'android';
      isMobile = screenWidth < 768;
      isTablet = screenWidth >= 768 && screenWidth < 1024;
      
      // Detect Samsung
      if (/Samsung/.test(userAgent) || /SM-/.test(userAgent)) {
        brand = 'Samsung';
        const match = userAgent.match(/SM-[A-Z0-9]+/);
        if (match) {
          model = match[0];
          deviceName = `Samsung ${model}`;
        } else {
          deviceName = 'Samsung Device';
        }
      }
      // Detect Google Pixel
      else if (/Pixel/.test(userAgent)) {
        brand = 'Google';
        const match = userAgent.match(/Pixel \d+/);
        if (match) {
          model = match[0];
          deviceName = match[0];
        } else {
          deviceName = 'Google Pixel';
        }
      }
      // Detect OnePlus
      else if (/OnePlus/.test(userAgent)) {
        brand = 'OnePlus';
        const match = userAgent.match(/OnePlus[A-Z0-9]+/);
        if (match) {
          model = match[0];
          deviceName = match[0];
        } else {
          deviceName = 'OnePlus Device';
        }
      }
      // Detect Xiaomi
      else if (/Mi |Redmi|POCO/.test(userAgent)) {
        brand = 'Xiaomi';
        const match = userAgent.match(/(Mi |Redmi|POCO)[A-Z0-9]+/);
        if (match) {
          model = match[0].trim();
          deviceName = match[0].trim();
        } else {
          deviceName = 'Xiaomi Device';
        }
      }
      // Generic Android
      else {
        brand = 'Android';
        deviceName = `Android Device (${screenWidth}x${screenHeight})`;
      }
    }
    // Desktop
    else {
      deviceType = 'desktop';
      isDesktop = true;
      deviceName = 'Desktop';
    }

    setDeviceInfo({
      deviceName,
      deviceType,
      model,
      brand,
      screenWidth,
      screenHeight,
      isMobile,
      isTablet,
      isDesktop,
    });
  }, []);

  return deviceInfo;
}

// Helper function to get device-specific padding
export function getDevicePadding(deviceInfo: DeviceInfo): {
  horizontal: string;
  vertical: string;
} {
  const { deviceType, deviceName, screenWidth } = deviceInfo;

  // iPhone-specific padding adjustments
  if (deviceType === 'iphone') {
    // iPhone SE and smaller models
    if (screenWidth <= 375) {
      return { horizontal: 'px-3', vertical: 'py-2.5' }; // 12px, 10px
    }
    // Standard iPhones
    else if (screenWidth <= 428) {
      return { horizontal: 'px-4', vertical: 'py-3' }; // 16px, 12px
    }
    // Larger iPhones
    else {
      return { horizontal: 'px-5', vertical: 'py-3.5' }; // 20px, 14px
    }
  }
  
  // Android-specific padding
  else if (deviceType === 'android') {
    // Small Android phones
    if (screenWidth <= 360) {
      return { horizontal: 'px-3', vertical: 'py-2.5' }; // 12px, 10px
    }
    // Standard Android phones
    else if (screenWidth <= 412) {
      return { horizontal: 'px-4', vertical: 'py-3' }; // 16px, 12px
    }
    // Larger Android phones
    else {
      return { horizontal: 'px-5', vertical: 'py-3.5' }; // 20px, 14px
    }
  }
  
  // iPad and tablets
  else if (deviceType === 'ipad' || deviceInfo.isTablet) {
    return { horizontal: 'px-6', vertical: 'py-4' }; // 24px, 16px
  }
  
  // Desktop - default
  return { horizontal: 'px-6', vertical: 'py-6' }; // 24px, 24px
}

