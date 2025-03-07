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
- 주어 (Subject): 문장에서 행동이나 상태의 주체
- 동사 (Verb): 문장에서 행동이나 상태를 나타내는 모든 동사를 포함합니다.
  * be동사 (is, am, are, was, were 등)
  * 일반동사
  * 조동사 (can, will, should 등)
  * 동사구의 모든 부분 (예: "have been working"의 경우 전체를 동사로 표시)
- 목적어 (Object): 동사의 행동을 받는 대상
- 전치사구 (Prepositional Phrase): 전치사와 그 목적어로 구성된 구
- 주격 보어 (Subject Complement): 주어를 설명하거나 보충하는 명사, 형용사, 또는 구
- 목적격 보어 (Object Complement): 목적어를 설명하거나 보충하는 명사, 형용사, 또는 구
- 동격 (Apposition): 앞에 나온 명사나 명사구를 다른 명사나 명사구로 부연 설명하는 것
- 과거분사 (Past Participle): 동사의 과거분사형이 형용사처럼 사용되는 경우

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