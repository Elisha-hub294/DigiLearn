import { View } from "react-native";
import { PastPaperItem, PastPaperItemData } from "./PastPaperItem";

type PastPaperListProps = {
  data: PastPaperItemData[];
};

export const PastPaperList = ({ data }: PastPaperListProps) => (
  <View>
    {data.map((item) => (
      <PastPaperItem key={item.id} item={item} />
    ))}
  </View>
);
