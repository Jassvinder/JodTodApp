import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/colors';
import { TEAM_BUILDER_COLOR } from '../constants/teamBuilder';
import { teamBuilderService } from '../services/teamBuilder';
import BottomNav from '../components/BottomNav';
import EmptyState from '../components/EmptyState';
import FormCard, { formInputStyle } from '../components/FormCard';
import HeaderAddButton from '../components/HeaderAddButton';
import AnnouncementCard from '../components/teamBuilder/AnnouncementCard';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import type { AnnouncementsResponse, TeamAnnouncement } from '../types/teamBuilder';

// A team's announcements: what my upline and I posted. Posting sends a push to everyone below me.
export default function AnnouncementsScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const toast = useToast();
  const confirm = useConfirm();
  const [data, setData] = useState<AnnouncementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const response = await teamBuilderService.getAnnouncements(Number(teamId));
      setData(response.data.data);
    } catch (err: any) {
      toast.show(err.response?.data?.message || 'Failed to load announcements.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnnouncements();
    }, [teamId]),
  );

  const handlePost = async () => {
    if (!message.trim()) {
      setError('Write a message.');
      return;
    }
    const trimmedLink = link.trim();
    setSaving(true);
    try {
      const response = await teamBuilderService.postAnnouncement(Number(teamId), {
        message: message.trim(),
        // Links without a scheme ("zoom.us/j/1") are saved as https.
        link: trimmedLink ? (/^https?:\/\//i.test(trimmedLink) ? trimmedLink : `https://${trimmedLink}`) : null,
      });
      toast.show(response.data.message, 'success');
      setMessage('');
      setLink('');
      setShowForm(false);
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (announcement: TeamAnnouncement) => {
    confirm.show({
      title: 'Delete Announcement',
      message: 'Delete this announcement? People who already got the notification keep it.',
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await teamBuilderService.deleteAnnouncement(announcement.id);
          fetchAnnouncements();
        } catch (err: any) {
          toast.show(err.response?.data?.message || 'Failed to delete.', 'error');
        }
      },
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={TEAM_BUILDER_COLOR} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <HeaderAddButton label="Post" color={TEAM_BUILDER_COLOR} visible={!!data?.can_post && !showForm} onPress={() => setShowForm(true)} />

      {/* Form stays outside FlatList to prevent keyboard dismiss on re-render */}
      {showForm && (
        <FormCard title="Message to your team" submitLabel="Send" submitColor={TEAM_BUILDER_COLOR} saving={saving} error={error} onSubmit={handlePost} onCancel={() => setShowForm(false)}>
          <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 8 }}>
            Everyone below you in this team gets a notification.
          </Text>
          <TextInput
            value={message}
            onChangeText={(text) => { setMessage(text); setError(''); }}
            placeholder="e.g. Zoom training on Sunday at 8 PM"
            placeholderTextColor={Colors.textMuted}
            maxLength={1000}
            multiline
            autoFocus
            style={{ ...formInputStyle, minHeight: 90, textAlignVertical: 'top' }}
          />
          <TextInput
            value={link}
            onChangeText={(text) => { setLink(text); setError(''); }}
            placeholder="Link (optional): video, meeting, document"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            keyboardType="url"
            maxLength={500}
            style={formInputStyle}
          />
        </FormCard>
      )}

      <FlatList
        data={data?.announcements ?? []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <AnnouncementCard announcement={item} onDelete={item.is_mine ? () => handleDelete(item) : undefined} />}
        ListEmptyComponent={
          showForm ? null : (
            <EmptyState
              icon="megaphone-outline"
              title="No announcements yet"
              text={data?.can_post
                ? 'Share meeting times, training videos or a word of motivation with everyone below you.'
                : 'Messages from your upline show up here.'}
              iconColor={TEAM_BUILDER_COLOR}
              iconBg="#fef3c7"
              actionLabel={data?.can_post ? 'Post Announcement' : undefined}
              actionColor={TEAM_BUILDER_COLOR}
              onAction={data?.can_post ? () => setShowForm(true) : undefined}
            />
          )
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnnouncements(); }} colors={[TEAM_BUILDER_COLOR]} />}
      />
      <BottomNav />
    </View>
  );
}
