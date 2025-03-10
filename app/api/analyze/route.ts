import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// API 키 설정 (환경 변수만 사용)
const apiKey = process.env.OPENAI_API_KEY;

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: apiKey,
});

export async function POST(request: Request) {
  try {
    // API 키가 설정되어 있지 않은 경우 오류 반환
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되어 있지 않습니다. 환경 변수를 확인해주세요.' },
        { status: 500 }
      );
    }

    const { sentence } = await request.json();

    if (!sentence || typeof sentence !== 'string') {
      return NextResponse.json(
        { error: '유효한 문장을 입력해주세요.' },
        { status: 400 }
      );
    }

    const prompt = `
영어 문장의 성분을 분석해주세요. 다음 성분들을 식별하고 JSON 형식으로 반환해주세요:
1. 주어 (Subject, S)
문장에서 행동이나 상태의 주체가 되는 요소.
보통 명사(Noun), 대명사(Pronoun), 명사구(Noun Phrase), 명사절(Noun Clause)로 구성됨.
예시:
She likes coffee. (She = 주어)
To read books is fun. (To read books = 주어, 진주어)
2. 가주어 (Expletive Subject, (가)S)
진주어를 대신하여 문장의 주어 역할을 하는 형식적(가짜) 주어.
주로 It이 사용됨.
예시:
It is important to study English. (It = 가주어, To study English = 진주어)
3. 진주어 (Real Subject, (진)S)
문장 내에서 의미적으로 주어 역할을 하는 구나 절.
가주어(it)이 대신 주어 역할을 할 때 실질적 주어가 됨.
예시:
It is necessary to exercise daily. (to exercise daily = 진주어)
4. 의미상 주어 (Logical Subject, (의)S)
특정 문법 구조(예: to부정사, 동명사)에서 의미적으로 주어 역할을 하는 요소.
예시:
It is important for students to focus. (for students = 의미상 주어)
5. 동사 (Verb, V)
문장에서 행동이나 상태를 나타내는 요소.

종류:

일반동사: run, eat, study 등
be동사: is, am, are, was, were
조동사: can, should, will 등
동사구: have been working, will have studied 등
예시:

She is happy. (is = be동사)
They have been studying for hours. (have been studying = 동사구)
6. 목적어 (Object, O)
동사의 행동을 받는 대상.
보통 명사(Noun), 대명사(Pronoun), 명사구(Noun Phrase), 명사절(Noun Clause)로 구성됨.
예시:
She reads a book. (a book = 목적어)
I know that she is coming. (that she is coming = 명사절 목적어)
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
보통 be동사 및 상태동사 뒤에 위치.
예시:
She is a teacher. (a teacher = 주격보어)
The sky looks blue. (blue = 주격보어)
10. 목적격보어 (Object Complement, OC)
목적어를 보충 설명하는 명사, 형용사, 또는 구.
예시:
They elected him president. (president = 목적격보어)
She made me happy. (happy = 목적격보어)
11. 동명사 (Gerund)
동사의 -ing 형태로 명사 역할을 하는 것.
예시:
Swimming is fun. (Swimming = 동명사, 주어 역할)
12. 과거분사 (Past Participle)
동사의 과거분사형이 형용사처럼 사용되는 경우.
예시:
The broken window needs repair. (broken = 과거분사, 형용사 역할)
13. 분사구문 (Participial Phrase)
현재분사(-ing) 또는 과거분사(-ed)로 시작하는 부가적 설명 구조.
예시:
Feeling tired, he went to bed. (Feeling tired = 분사구문)
14. 전치사구 (Prepositional Phrase)
전치사 + 명사(구)로 이루어진 구조.
예시:
She is in the park. (in the park = 전치사구)
15. 부사구 (Adverbial Phrase)
부사 역할을 하는 구.
예시:
He spoke with confidence. (with confidence = 부사구)
16. 형용사구 (Adjective Phrase)
형용사 역할을 하는 구.
예시:
She is very intelligent. (very intelligent = 형용사구)
17. 동격 (Apposition)
앞에 나온 명사를 다른 명사 또는 명사구로 부연 설명하는 것.
예시:
My friend, a doctor, lives in New York. (a doctor = 동격)
18. 명사절 (Noun Clause)
문장에서 명사 역할을 하는 절.
예시:
I know that she is coming. (that she is coming = 명사절)
19. 부사절 (Adverbial Clause)
문장에서 부사 역할을 하는 절.
예시:
I will call you when I arrive. (when I arrive = 부사절)
20. 관계절 (Relative Clause)
관계대명사 또는 관계부사를 포함하여 앞의 명사를 수식하는 절.
예시:
The book that I borrowed is interesting. (that I borrowed = 관계절)

중요: 
1. 한 요소가 여러 문법적 역할을 동시에 수행할 수 있습니다. 예를 들어, 'is'는 동사이면서 주격 보어의 일부일 수 있습니다.
2. 모든 동사는 반드시 "동사" 타입으로 표시되어야 합니다.
3. be동사(is, am, are 등)도 반드시 동사로 표시해야 합니다.
4. 과거분사가 형용사처럼 사용될 때는 "과거분사" 타입으로 표시합니다.
5. 문장의 모든 주요 성분을 빠짐없이 식별해주세요.
6. 복잡한 구나 절도 적절한 성분으로 분류해주세요.
7. 같은 단어나 구가 여러 역할을 할 경우, 각 역할에 대해 별도의 컴포넌트로 반환해주세요.
8. 특히 'is', 'are', 'was', 'were'와 같은 be동사는 항상 독립적인 "동사" 컴포넌트로 반환하고, 동시에 주격 보어의 일부로도 포함시켜 주세요.
9. 주어진 문장에서 모든 동사를 찾아 반드시 "동사" 타입으로 표시해주세요. 특히 "is", "are", "was", "were", "am", "be", "been", "being"과 같은 be동사도 반드시 동사로 표시해야 합니다.
10. 'is'와 같은 be동사는 반드시 별도의 "동사" 컴포넌트로 표시해야 합니다. 예를 들어, "today's episode is especially for my teenage subscribers"에서 "is"는 반드시 별도의 동사 컴포넌트로 표시해야 합니다.
11. 문장에서 "is"가 있다면, 반드시 다음과 같이 별도의 동사 컴포넌트로 표시해야 합니다:
    {
      "type": "동사",
      "text": "is"
    }

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
- "eight years ago": 목적어
- "as a high school student": 전치사구
- "that": 주어
- "is": 동사 (that's의 일부)
- "why today's episode is especially for my teenage subscribers": 주격 보어
- "today's episode": 주어
- "is": 동사
- "especially for my teenage subscribers": 주격 보어
- "for my teenage subscribers": 전치사구

문장: "why today's episode is especially for my teenage subscribers"
분석:
- "why": 접속사
- "today's episode": 주어
- "is": 동사
- "especially for my teenage subscribers": 주격 보어
- "for my teenage subscribers": 전치사구

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
      "type": "주격 보어",
      "text": "happy"
    },
    {
      "type": "주격 보어",
      "text": "is happy"
    }
  ]
}

분석할 문장: "${sentence}"
`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '당신은 영어 문법 전문가입니다. 영어 문장의 성분을 정확하게 분석하는 역할을 합니다. 특히 보어는 반드시 주격 보어(주어를 설명하는 보어)와 목적격 보어(목적어를 설명하는 보어)로 명확하게 구분하여 분석해야 합니다. 단순히 "보어"로만 표시하지 마세요.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content || '';
      
      // JSON 문자열 추출 (GPT가 때때로 마크다운 코드 블록으로 감싸서 반환할 수 있음)
      const jsonMatch = content.match(/```json\n([\s\S]*)\n```/) || 
                        content.match(/```\n([\s\S]*)\n```/) || 
                        content.match(/{[\s\S]*}/);
      
      let analysisResult;
      
      if (jsonMatch) {
        try {
          const jsonContent = jsonMatch[1] || jsonMatch[0];
          // 유효한 JSON인지 확인
          const parsedJson = JSON.parse(jsonContent);
          
          // components 배열이 있는지 확인하고 각 항목이 필요한 속성을 가지고 있는지 검증
          if (parsedJson && parsedJson.components && Array.isArray(parsedJson.components)) {
            // 각 컴포넌트가 유효한지 확인
            parsedJson.components = parsedJson.components.filter((comp: any) => 
              comp && typeof comp === 'object' && comp.type && comp.text
            );
            
            analysisResult = {
              sentence,
              components: parsedJson.components
            };
          } else {
            // 유효한 components 배열이 없는 경우
            analysisResult = { 
              sentence, 
              rawResponse: content,
              components: [] 
            };
          }
        } catch (e) {
          console.error('JSON 파싱 오류:', e);
          // JSON 파싱 실패 시 원본 텍스트 반환
          analysisResult = { 
            sentence, 
            rawResponse: content,
            components: [] 
          };
        }
      } else {
        // JSON 형식이 아닌 경우 원본 텍스트 반환
        analysisResult = { 
          sentence, 
          rawResponse: content,
          components: [] 
        };
      }

      return NextResponse.json(analysisResult);
    } catch (error: any) {
      console.error('OpenAI API 오류:', error);
      return NextResponse.json(
        { error: 'OpenAI API 호출 중 오류가 발생했습니다.', details: error?.message || '알 수 없는 오류' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error analyzing sentence:', error);
    return NextResponse.json(
      { error: '문장 분석 중 오류가 발생했습니다.', details: error?.message || '알 수 없는 오류' },
      { status: 500 }
    );
  }
} 