import { Image, View } from "react-native";

interface AppLogoProps {
  height?: number;
  marginBottom?: number;
}

export default function AppLogo({
  height = 40,
  marginBottom = 25,
}: AppLogoProps) {
  return (
    <View
      style={{
        height,
        aspectRatio: 1835 / 433,
        marginBottom,
        alignSelf: "center",
      }}
    >
      <Image
        source={require("../../assets/images/logo.png")}
        resizeMode="contain"
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </View>
  );
}
