import { Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { TEAM_BUILDER_COLOR } from '../../constants/teamBuilder';
import type { WeeklyTarget } from '../../types/teamBuilder';

function ProgressRow({ label, done, goal }: { label: string; done: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0;
  const reached = done >= goal;
  return (
    <View style={{ marginTop: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 13, color: Colors.text }}>{label}</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: reached ? '#16a34a' : Colors.text }}>
          {done} / {goal}
        </Text>
      </View>
      <View style={{ height: 8, backgroundColor: Colors.border, borderRadius: 4 }}>
        <View style={{ height: 8, borderRadius: 4, width: `${pct}%`, backgroundColor: reached ? '#16a34a' : TEAM_BUILDER_COLOR }} />
      </View>
    </View>
  );
}

// This week's plans and follow-ups against a weekly target. Rows with a 0 target are hidden.
export default function TargetProgress({ target, plans, followUps }: { target: WeeklyTarget; plans: number; followUps: number }) {
  return (
    <View>
      {target.plans_per_week > 0 && <ProgressRow label="Plans shown" done={plans} goal={target.plans_per_week} />}
      {target.follow_ups_per_week > 0 && <ProgressRow label="Follow-ups" done={followUps} goal={target.follow_ups_per_week} />}
      {!!target.set_by_name && (
        <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 8 }}>Target set by {target.set_by_name}</Text>
      )}
    </View>
  );
}
