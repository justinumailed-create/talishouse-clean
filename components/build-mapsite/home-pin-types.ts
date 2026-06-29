export interface HomePinLocationValues {
  streetAddress: string;
  latitude: string;
  longitude: string;
  pinWriteup: string;
  futurePinColor: string | null;
  futurePinIcon: string | null;
  futurePinBorder: string | null;
  futurePinLabel: string | null;
}

export const defaultHomePinLocationValues: HomePinLocationValues = {
  streetAddress: "",
  latitude: "",
  longitude: "",
  pinWriteup: "",
  futurePinColor: null,
  futurePinIcon: null,
  futurePinBorder: null,
  futurePinLabel: null,
};

export const PIN_WRITEUP_MAX_LENGTH = 170;
