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
다음 영어 문장의 문장 성분을 분석해주세요:

"${sentence}"

다음 문장 성분들을 찾아서 JSON 형식으로 반환해주세요:
- 주어 / 진주어 / 가주어 / 의미상 주어
- 동사
- 목적어 / 간접 목적어 / 직접 목적어 / 진목적어 / 가목적어
- 주격 보어 / 목적격 보어
- to부정사 (주어, 진주어, 목적어, 진목적어, 주격보어, 목적어, 형용사, 부사)
- 동명사 (주어, 목적어, 보어, 전치사 목적어)
- 분사 (과거분사/현재분사)
- 분사구문
- 전치사구
- 부사구
- 형용사구
- 등위어
- 등위절
- 동격
- 명사절 (주어, 진주어, 목적어, 직접 목적어, 진목적어, 주격 보어, 목적격 보어)
- 부사절
- 관계절 (주격 관대, 목적격 관대, 소유격 관대, 관계부사)
- 삽입절

각 문장 성분에 대해 해당하는 단어나 구를 표시하고, 그 역할을 설명해주세요.
결과는 다음과 같은 JSON 형식으로 반환해주세요:

{
  "sentence": "원본 문장",
  "components": [
    {
      "type": "문장 성분 유형",
      "text": "해당 단어 또는 구",
      "role": "문장에서의 역할 설명"
    }
  ]
}

없는 성분은 생략해도 됩니다.
`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '당신은 영어 문법 전문가입니다. 영어 문장의 성분을 정확하게 분석하는 역할을 합니다.',
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
          analysisResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (e) {
          // JSON 파싱 실패 시 원본 텍스트 반환
          analysisResult = { sentence, rawResponse: content };
        }
      } else {
        // JSON 형식이 아닌 경우 원본 텍스트 반환
        analysisResult = { sentence, rawResponse: content };
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