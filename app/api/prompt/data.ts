// 기본 시스템 프롬프트
export const DEFAULT_SYSTEM_PROMPT = `당신은 영어 문법 전문가입니다. 영어 문장의 성분을 정확하게 분석하는 역할을 합니다.`;

// 기본 사용자 프롬프트
export const DEFAULT_USER_PROMPT = `
영어 문장의 성분을 분석해주세요. 다음 성분들을 식별하고 JSON 형식으로 반환해주세요:

#. 문장 성분 분석

1. 주어 (Subject, S)
문장에서 행동이나 상태의 주체가 되는 요소.
보통 명사(Noun), 대명사(Pronoun), 명사구(Noun Phrase), 명사절(Noun Clause)로 구성됨.

2. 가주어 (Expletive Subject, (가)S)
진주어를 대신하여 문장의 주어 역할을 하는 형식적(가짜) 주어.
예시:
It is important to study English. (It = 가주어, To study English = 진주어)

3. 진주어 (Real Subject, (진)S)
문장 내에서 의미적으로 주어 역할을 하는 구나 절.
예시:
It is necessary to exercise daily. (to exercise daily = 진주어)

4. 의미상 주어 (Logical Subject, (의)S)
특정 문법 구조(예: to부정사, 동명사)에서 의미적으로 주어 역할을 하는 요소.
예시:
It is important for students to focus. (for students = 의미상 주어)

5. 동사 (Verb, V)
문장에서 행동이나 상태를 나타내는 요소.
예시:
She is happy. (is = 동사)
They have been studying for hours. (have been studying = 동사)

6. 목적어 (Object, O)
동사의 행동을 받는 대상.
예시:
She reads a book. (a book = 목적어)

7. 간접목적어 (Indirect Object, IO)
직접목적어가 전달되는 대상.
보통 사람을 의미함.
예시:
She gave me a gift. (me = 간접목적어)

8. 직접목적어 (Direct Object, DO)
동사의 직접적인 영향을 받는 대상.
예시:
She gave me a gift. (a gift = 직접목적어)

9. 주격보어 (Subject Complement, SC)
주어를 보충 설명하는 명사, 형용사, 또는 구.
예시:
She is a teacher. (a teacher = 주격보어)

10. 목적격보어 (Object Complement, OC)
목적어를 보충 설명하는 명사, 형용사, 또는 구.
예시:
They elected him president. (president = 목적격보어)

#.문법요소 분석 (두 단어 이상의 구만 표기)

1. 일반 명사구 (Noun Phrase)
예시: the big red car

2.동명사구 (Gerund Phrase)
예시: Swimming in the ocean

3. to부정사구(명사적 용법) (Infinitive Phrase as Noun)
예시: To study hard

4. 의문사+to부정사구 (WH-word + Infinitive)
예시: What to do next

5. 현재분사구 (Present Participle Phrase)
예시: running in the park

6. 과거분사구 (Past Participle Phrase)
예시: broken in the storm

7. 전치사구(형용사적 용법) (Prepositional Phrase as Adjective)
예시: the man in the blue shirt

8. to부정사구(형용사적 용법) (Infinitive Phrase as Adjective)
예시: a book to read

9. 전치사구(부사적 용법) (Prepositional Phrase as Adverb)
예시: in the morning

10.to부정사구(부사적 용법) (Infinitive Phrase as Adverb)
예시: to win the game

11.부사+부사구 (Adverb + Adverbial Phrase)
예시: very quickly

12. 접속사 that절 (That Clause)
예시: that he came late

13. 의문사절(wh절) (WH-Clause)
예시: what he said

14. if/whether절 (If/Whether Clause)
예시: whether he will come

15. 관계사 what절 (What Clause)
예시: what you need

16.주격 관계대명사절 (Subject Relative Clause)
예시: who came yesterday

17.목적격 관계대명사절 (Object Relative Clause)
예시: whom I met

18. 관계부사절 (Relative Adverb Clause)
예시: where I live

19.부사절
시간절, 조건절, 이유절, 양보절, 목적절, 결과절, 비교절, 양태절 (Adverbial Clause)
예시: because he was late (이유절)
when he arrives (시간절)
if it rains (조건절)

중요: 
1. 한 요소가 여러 문법적 역할을 동시에 수행할 수 있습니다. 예를 들어, 'is'는 동사이면서 주격 보어의 일부일 수 있습니다.
2. 모든 동사는 반드시 "동사" 타입으로 표시되어야 합니다.
3. be동사(is, am, are 등)도 반드시 동사로 표시해야 합니다.
4. 과거분사가 형용사처럼 사용될 때는 "과거분사구" 타입으로 표시합니다.
5. 문장의 모든 주요 성분을 빠짐없이 식별해주세요.
6. 복잡한 구나 절도 적절한 성분으로 분류해주세요.
7. 같은 단어나 구가 여러 역할을 할 경우, 각 역할에 대해 별도의 컴포넌트로 반환해주세요.
8. 특히 'is', 'are', 'was', 'were'와 같은 be동사는 항상 독립적인 "동사" 컴포넌트로 반환하고, 동시에 주격 보어의 일부로도 포함시켜 주세요.
9. 주어진 문장에서 모든 동사를 찾아 반드시 "동사" 타입으로 표시해주세요. 특히 "is", "are", "was", "were", "am", "be", "been", "being"과 같은 be동사도 반드시 동사로 표시해야 합니다.

예시:
문장: "He is happy."
분석:
- "He": 주어
- "is": 동사
- "happy": 주격보어

문장: "I started eight years ago as a high school student, and that's why today's episode is especially for my teenage subscribers."
분석:
- "I": 주어
- "started": 동사
- "eight years ago": 부사구
- "as a high school student": 전치사구(부사적용법)
- "that": 주어
- "is": 동사 (that's의 일부)
- "why today's episode is especially for my teenage subscribers": 주격보어
- "today's episode": 주어
- "is": 동사
- "especially for my teenage subscribers": 주격보어
- "for my teenage subscribers": 전치사구(부사적용법)

다음 형식으로 JSON을 반환해주세요:
{
  "components": [
    {
      "type": "주어",
      "text": "He"
    },
    {
      "type": "동사",
      "text": "is"
    },
    {
      "type": "주격보어",
      "text": "happy"
    }
  ]
}

분석할 문장: "{sentence}"
`; 