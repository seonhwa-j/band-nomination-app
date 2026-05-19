export type SongComment = {
  id: string;
  songId: string;
  userId: string;
  userName: string;
  userPart: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
};
