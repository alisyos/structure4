import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_USER_PROMPT } from './data';

// 프롬프트 파일 경로
const PROMPT_FILE_PATH = path.join(process.cwd(), 'app/api/prompt/custom_prompts.json');

// 기본 프롬프트 상태
const DEFAULT_PROMPTS = {
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  userPrompt: DEFAULT_USER_PROMPT,
};

// 프롬프트 가져오기
export async function GET() {
  try {
    // 파일이 존재하는지 확인
    try {
      await fs.access(PROMPT_FILE_PATH);
    } catch (error) {
      // 파일이 없으면 기본값으로 생성
      await fs.writeFile(PROMPT_FILE_PATH, JSON.stringify(DEFAULT_PROMPTS, null, 2), 'utf8');
      return NextResponse.json(DEFAULT_PROMPTS);
    }

    // 파일 읽기
    const fileContent = await fs.readFile(PROMPT_FILE_PATH, 'utf8');
    const prompts = JSON.parse(fileContent);
    
    return NextResponse.json(prompts);
  } catch (error) {
    console.error('프롬프트 가져오기 오류:', error);
    return NextResponse.json(
      { error: '프롬프트를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 프롬프트 저장하기
export async function POST(request: Request) {
  try {
    const { systemPrompt, userPrompt } = await request.json();
    
    if (!systemPrompt || !userPrompt) {
      return NextResponse.json(
        { error: '시스템 프롬프트와 사용자 프롬프트가 모두 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 프롬프트 업데이트
    const updatedPrompts = {
      systemPrompt,
      userPrompt,
    };
    
    // 파일에 저장
    await fs.writeFile(PROMPT_FILE_PATH, JSON.stringify(updatedPrompts, null, 2), 'utf8');
    
    return NextResponse.json({ success: true, message: '프롬프트가 성공적으로 저장되었습니다.' });
  } catch (error) {
    console.error('프롬프트 저장 오류:', error);
    return NextResponse.json(
      { error: '프롬프트를 저장하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 