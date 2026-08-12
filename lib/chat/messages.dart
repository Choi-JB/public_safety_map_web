import 'package:supabase_flutter/supabase_flutter.dart';

final supabase = Supabase.instance.client;

Future<List<Map<String, dynamic>>> fetchMessages(String roomId) async {
  final rows = await supabase
      .from('messages')
      .select()
      .eq('room_id', roomId)
      .order('created_at', ascending: true);
  return List<Map<String, dynamic>>.from(rows);
}

Future<void> sendMessage({
  required String roomId,
  required String senderId,
  required String content,
  String? senderName,
}) async {
  await supabase.from('users').upsert({
    'user_id': senderId,
    'name': senderName ?? senderId,
    'is_online': true,
    'role': 'USER',
  }, onConflict: 'user_id');

  await supabase.from('chat_rooms').upsert({
    'room_id': roomId,
    'room_name': '$roomId번 대화방',
    'room_type': 'DIRECT',
    'is_active': true,
  }, onConflict: 'room_id');

  await supabase.from('messages').insert({
    'message_id': 'msg_${DateTime.now().millisecondsSinceEpoch}',
    'room_id': roomId,
    'sender_id': senderId,
    'content': content,
    'message_type': 'TEXT',
  });
}

RealtimeChannel subscribeRoom(
  String roomId,
  void Function(Map<String, dynamic> row) onInsert,
) {
  return supabase
      .channel('room:$roomId')
      .onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'messages',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'room_id',
          value: roomId,
        ),
        callback: (payload) => onInsert(payload.newRecord),
      )
      .subscribe();
}