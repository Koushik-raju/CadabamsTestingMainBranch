import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const hapticLight = (): void => {
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
};

export const hapticMedium = (): void => {
  Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
};

export const hapticSuccess = (): void => {
  Haptics.notification({ type: NotificationType.Success }).catch(() => {});
};

export const hapticWarning = (): void => {
  Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
};
