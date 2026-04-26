export const geolocationService = {
  async getCurrentPosition(options = {}) {
    const {
      timeout = 8000,
      maximumAge = 600000,
      enableHighAccuracy = false,
      fallbackToLowAccuracy = true,
      ...otherOptions
    } = options;

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      const attemptGetLocation = (highAccuracy) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            });
          },
          (error) => {
            if (highAccuracy && error.code === error.TIMEOUT && fallbackToLowAccuracy) {
              attemptGetLocation(false);
              return;
            }

            let errorMessage = "Unable to retrieve your location";

            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage =
                  "Location access denied. Enable location permissions in your browser and refresh.";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = "Location information is unavailable.";
                break;
              case error.TIMEOUT:
                errorMessage = "Location request timed out. Try again.";
                break;
              default:
                break;
            }

            reject(new Error(errorMessage));
          },
          {
            timeout,
            maximumAge,
            enableHighAccuracy: highAccuracy,
            ...otherOptions,
          },
        );
      };

      attemptGetLocation(enableHighAccuracy);
    });
  },
};
