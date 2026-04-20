interface Props {
  name: string;
  slotCount: number;
}

export function SubmitSuccessAuthed({ name, slotCount }: Props) {
  return (
    <div className="max-w-xl mx-auto px-6 py-10 text-center">
      <div className="inline-block text-3xl mb-4">✓</div>
      <h2 className="text-xl font-semibold">{name} 님, 응답이 저장되었습니다</h2>
      <p className="text-sm text-muted-foreground mt-2">
        {slotCount}개의 가능 시간이 저장되었어요. 같은 계정으로 재접속하면 수정할 수 있어요.
      </p>
    </div>
  );
}
