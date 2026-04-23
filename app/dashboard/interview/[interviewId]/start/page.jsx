'use client';
import { db } from "@/utils/db";
import { MockInterview, UserAnswer } from "@/utils/schema";
import { eq } from "drizzle-orm";
import React, { useState, useEffect } from "react";
import QuestionsSection from "./_components/QuestionsSection";
import RecordAnswerSection from "./_components/RecordAnswerSection";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from 'next/navigation';

const StartInterview = () => {
  const { interviewId } = useParams();
  const [interviewData, setInterviewData] = useState();
  const [mockInterviewQuestions, setMockInterviewQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (interviewId) {
      GetInterviewDetails(interviewId);
    }
  }, [interviewId]);

  useEffect(() => {
    if (interviewId && mockInterviewQuestions.length > 0) {
      loadAnsweredQuestions(interviewId, mockInterviewQuestions);
    }
  }, [interviewId, mockInterviewQuestions]);

  const GetInterviewDetails = async (interviewId) => {
    try {
      console.log('Fetching interview details for ID:', interviewId);

      const result = await db
        .select()
        .from(MockInterview)
        .where(eq(MockInterview.mockId, interviewId));

      if (result.length === 0) {
        console.error('No interview found with ID:', interviewId);
        return;
      }

      const jsonMockResp = JSON.parse(result[0].jsonMockResp);
      console.log(jsonMockResp);
      setMockInterviewQuestions(jsonMockResp);
      setInterviewData(result[0]);
    } catch (error) {
      console.error('Error fetching interview details:', error);
    }
  };

  const loadAnsweredQuestions = async (id, questions) => {
    try {
      const answers = await db
        .select({ question: UserAnswer.question })
        .from(UserAnswer)
        .where(eq(UserAnswer.mockIdRef, id))
        .orderBy(UserAnswer.id);

      const answeredIndexSet = new Set();
      answers.forEach((item) => {
        const matchIndex = questions.findIndex(
          (question) => question.question === item.question
        );
        if (matchIndex >= 0) {
          answeredIndexSet.add(matchIndex);
        }
      });

      setAnsweredQuestions(answeredIndexSet);
    } catch (error) {
      console.error("Error loading answered questions:", error);
    }
  };

  const handleAnswerSaved = (questionIndex) => {
    if (typeof questionIndex !== "number") return;
    setAnsweredQuestions((prev) => {
      const next = new Set(prev);
      next.add(questionIndex);
      return next;
    });
  };

  const isBusy = isRecording || isSaving;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 my-10">
        <QuestionsSection 
          mockInterviewQuestions={mockInterviewQuestions} 
          activeQuestionIndex={activeQuestionIndex} 
          answeredQuestionIndexes={[...answeredQuestions]}
        />
        <RecordAnswerSection
          mockInterviewQuestions={mockInterviewQuestions} 
          activeQuestionIndex={activeQuestionIndex}
          interviewData={interviewData} 
          onAnswerSaved={handleAnswerSaved}
          onRecordingChange={setIsRecording}
          onSavingChange={setIsSaving}
        />
      </div>
      <div className="flex gap-3 my-5 md:my-0 md:justify-end md:gap-6">
        {activeQuestionIndex > 0 && (
          <Button
            onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}
            disabled={isBusy}
          >
            Previous Question
          </Button>
        )}
        {activeQuestionIndex !== mockInterviewQuestions?.length - 1 && (
          <Button
            onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}
            disabled={isBusy}
          >
            Next Question
          </Button>
        )}
        {activeQuestionIndex === mockInterviewQuestions?.length - 1 && (
          isBusy ? (
            <Button disabled>End Interview</Button>
          ) : (
            <Link href={`/dashboard/interview/${interviewId}/Feedback`}>
              <Button>End Interview</Button>
            </Link>
          )
        )}
      </div>
    </div>
  );
};

export default StartInterview;
