/**
 * Golden set for the AI-fragility gate (DESIGN §11). A reference essay plus a set
 * of probes written against it — most deliberately fragile (answerable only by
 * someone who wrote THIS essay), with two intentionally generic probes so the
 * metric is shown to discriminate. `evals/fragility/run.ts` scores these blind
 * (no essay) with a real frontier model and checks the < 25%-answerable gate.
 */

export const goldenEssay = `Chính sách miễn học phí trung học phổ thông tại tỉnh X nên được duy trì.
Luận điểm của tôi là chính sách này làm tăng tỉ lệ nhập học ở nhóm hộ nghèo.
Bằng chứng tôi dùng là số liệu của Sở Giáo dục tỉnh X năm 2025, cho thấy tỉ lệ
nhập học lớp 10 ở nhóm hộ nghèo tăng từ 71% lên 84% sau hai năm áp dụng.
Tôi giả định rằng chi phí học phí là rào cản chính, quan trọng hơn chi phí cơ hội
khi trẻ đi làm sớm. Tôi cũng thừa nhận một giới hạn: số liệu chỉ trong hai năm,
nên chưa loại trừ được ảnh hưởng của gói hỗ trợ tiền mặt triển khai cùng lúc.`

export type GoldenProbe = {
  readonly id: string
  readonly textVi: string
  /** Author's expectation: is this answerable by a model WITHOUT the essay? */
  readonly expectedAnswerableBlind: boolean
}

export const goldenProbes: readonly GoldenProbe[] = [
  {
    id: 'g1',
    textVi:
      'Bạn giả định chi phí học phí là rào cản chính, quan trọng hơn chi phí cơ hội. Nếu giả định đó sai thì kết luận của bạn thay đổi thế nào?',
    expectedAnswerableBlind: false,
  },
  {
    id: 'g2',
    textVi:
      'Số liệu của bạn cho thấy tỉ lệ nhập học nhóm hộ nghèo tăng từ 71% lên 84%. Vì sao con số này chưa đủ để kết luận chính sách là nguyên nhân?',
    expectedAnswerableBlind: false,
  },
  {
    id: 'g3',
    textVi:
      'Bạn thừa nhận gói hỗ trợ tiền mặt triển khai cùng lúc. Hãy thiết kế cách để tách riêng ảnh hưởng của miễn học phí khỏi gói hỗ trợ đó.',
    expectedAnswerableBlind: false,
  },
  {
    id: 'g4',
    textVi: 'Điểm yếu nhất trong lập luận của chính bạn nằm ở đâu, và vì sao bạn cho là như vậy?',
    expectedAnswerableBlind: false,
  },
  {
    id: 'g5',
    textVi:
      'Bạn chọn duy trì chính sách. Vì sao không chọn phương án chỉ miễn học phí cho riêng nhóm hộ nghèo?',
    expectedAnswerableBlind: false,
  },
  {
    id: 'g6',
    textVi:
      'Áp dụng lập luận của bạn cho một tỉnh có tỉ lệ hộ nghèo thấp hơn nhiều: kết luận có còn giữ nguyên không?',
    expectedAnswerableBlind: false,
  },
  // Intentionally generic — a model can answer these without the essay.
  {
    id: 'g7',
    textVi: 'Miễn học phí trung học phổ thông có những lợi ích chung nào?',
    expectedAnswerableBlind: true,
  },
  {
    id: 'g8',
    textVi: 'Nêu định nghĩa của “tỉ lệ nhập học” trong giáo dục.',
    expectedAnswerableBlind: true,
  },
]
