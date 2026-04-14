import type { AlbumDraftFormState } from "@/src/lib/album-flow";

export const sampleDraftForm: AlbumDraftFormState = {
  anniversaryType: "1year",
  anniversaryDate: "2026-04-20",
  senderName: "민수",
  receiverName: "지은",
  title: "A Year Written In Us",
  subtitle: "사진과 편지로 묶은 첫 번째 기념일 선물",
  letter:
    "지은아, 우리의 일 년은 생각보다 더 선명하게 남아 있었어. 함께 걷던 밤, 웃음이 터졌던 식탁, 서로를 닮아가던 계절을 한 권에 담아봤어. 이 책이 오늘을 오래 기억하게 해주면 좋겠어.",
  coverPhotoUrl: "/dummy/photos/cover.svg",
  moments: [
    {
      id: "sample_1",
      date: "2025-04-21",
      title: "첫 장면",
      body: "카페 창가에서 어색하게 웃다가, 결국 제일 오래 이야기했던 날.",
      photoUrl: "/dummy/photos/moment-01.svg",
    },
    {
      id: "sample_2",
      date: "2025-06-15",
      title: "초여름 산책",
      body: "해 지기 전 강가를 따라 걷다가 손을 꼭 잡았던 저녁.",
      photoUrl: "/dummy/photos/moment-02.svg",
    },
    {
      id: "sample_3",
      date: "2025-08-30",
      title: "작은 여행",
      body: "낯선 골목에서 길을 잃었는데도 이상하게 안심됐던 하루.",
      photoUrl: "/dummy/photos/moment-03.svg",
    },
    {
      id: "sample_4",
      date: "2025-11-12",
      title: "비 오는 밤",
      body: "우산이 작아서 더 가까워졌고, 웃음이 끊기지 않았던 귀갓길.",
      photoUrl: "/dummy/photos/moment-04.svg",
    },
    {
      id: "sample_5",
      date: "2026-02-14",
      title: "다정한 루틴",
      body: "특별한 이벤트보다 평범한 하루가 더 큰 선물 같다는 걸 알게 됐어.",
      photoUrl: "/dummy/photos/moment-05.svg",
    },
  ],
};
