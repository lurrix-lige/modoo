export type RootStackParamList = {
  Home: undefined;
  Guide: undefined;
  Auth: { screen?: string; fromScreen?: string; selectedPlanId?: string } | undefined;
  Membership: { selectedPlanId?: string } | undefined;
  Main: undefined;
  ChildLock: {
    onSuccess: () => void;
  };
  ComfortMode: undefined;
  ChildProfile: ChildProfileParams | undefined;
};

export type ChildProfileParams = {
  mode: 'create' | 'edit' | 'view';
  source?: 'auth' | 'parent' | 'checkin';
  callbackId?: string;
  initialData?: {
    id?: string;
    nickname?: string;
    birthday?: string;
    gender?: 'male' | 'female';
    guardianIP?: 'moon' | 'firefly' | 'star';
    guardianSpiritId?: 'moon' | 'firefly' | 'star';
    sleepProblems?: string[];
  };
};

export type AuthStackParamList = {
  Login: undefined;
};

export type ChildrenTabParamList = {
  ChildrenHome: undefined;
  Course: undefined;
  Breathing: undefined;
  CheckIn: undefined;
};

export type ChildrenStackParamList = {
  ChildrenTab: undefined;
  StoryPlayer: { storyId: string };
  CourseDetail: { courseId: string };
  BreathingPractice: undefined;
  CourseLearning: {
    lessonId: string;
    courseId?: string;
    backgroundMusicUrl?: string;
    voiceGuideUrl?: string;
    contentUrl?: string;
    lessonTitle?: string;
    lessonDuration?: number;
  };
};

export type ParentTabParamList = {
  ParentHome: undefined;
  Knowledge: undefined;
  Services: undefined;
  Profile: undefined;
};

export type ParentStackParamList = {
  ParentTab: undefined;
  UserDashboard: undefined;
  ArticleDetail: { articleId: string };
  Dialogue: { scenario?: string } | undefined;
  ExpertConsult: undefined;
  ExpertBookings: undefined;
  Membership: { selectedPlanId?: string };
  Settings: undefined;
  GrowthRecord: undefined;
  NotificationSettings: undefined;
  PrivacySettings: undefined;
  AboutUs: undefined;
  ChildProfile: ChildProfileParams | undefined;
  RelaxSpace: undefined;
  ParentCheckIn: undefined;
  Favorites: undefined;
  StoryPlayer: { storyId: string };
};
