import { StyleSheet, View } from 'react-native';
import { spacing } from '../../constants/theme';
import { PastPaperItem, PastPaperItemData } from './PastPaperItem';

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

const styles = StyleSheet.create({
  list: {
    paddingBottom: spacing.xl,
  },
});
