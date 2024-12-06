import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { EnableWhen, Question } from "@/types/questionnaire/question";

import { AllergyQuestion } from "./AllergyQuestion";
import { ChoiceQuestion } from "./ChoiceQuestion";
import { MedicationQuestion } from "./MedicationQuestion";
import { NotesInput } from "./NotesInput";

interface QuestionInputProps {
  question: Question;
  questionnaireResponses: QuestionnaireResponse[];
  updateQuestionnaireResponseCB: (
    questionnaireResponse: QuestionnaireResponse,
  ) => void;
}

export function QuestionInput({
  question,
  questionnaireResponses,
  updateQuestionnaireResponseCB,
}: QuestionInputProps) {
  const questionnaireResponse = questionnaireResponses.find(
    (v) => v.question_id === question.id,
  ) || {
    question_id: question.id,
    link_id: question.link_id,
    values: [],
  };

  const isQuestionEnabled = () => {
    if (!question.enable_when?.length) return true;

    const checkCondition = (enableWhen: EnableWhen) => {
      const dependentValue = questionnaireResponses.find(
        (v) => v.link_id === enableWhen.question,
      )?.values[0];

      switch (enableWhen.operator) {
        case "exists":
          return dependentValue !== undefined && dependentValue !== null;
        case "equals":
          return dependentValue === enableWhen.answer;
        case "not_equals":
          return dependentValue !== enableWhen.answer;
        case "greater":
          return (
            dependentValue !== undefined && dependentValue > enableWhen.answer
          );
        case "less":
          return (
            dependentValue !== undefined && dependentValue < enableWhen.answer
          );
        case "greater_or_equals":
          return (
            dependentValue !== undefined && dependentValue >= enableWhen.answer
          );
        case "less_or_equals":
          return (
            dependentValue !== undefined && dependentValue <= enableWhen.answer
          );
        default:
          return true;
      }
    };

    return question.enable_behavior === "any"
      ? question.enable_when.some(checkCondition)
      : question.enable_when.every(checkCondition);
  };

  const handleNumberChange = (newValue: string, index: number) => {
    const updatedValues = [...questionnaireResponse.values];
    updatedValues[index] =
      question.type === "decimal"
        ? parseFloat(newValue)
        : parseInt(newValue, 10);

    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: updatedValues,
    });
  };

  const addValue = () => {
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [...questionnaireResponse.values],
    });
  };

  const removeValue = (index: number) => {
    const updatedValues = questionnaireResponse.values.filter(
      (_, i) => i !== index,
    );
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: updatedValues,
    });
  };

  const renderSingleInput = (value: any, index: number) => {
    const isEnabled = isQuestionEnabled();
    const commonProps = {
      disabled: !isEnabled,
      "aria-hidden": !isEnabled,
    };

    const removeButton = question.repeats &&
      questionnaireResponse.values.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeValue(index)}
          className="h-10 w-10"
        >
          <CareIcon icon="l-trash" className="h-4 w-4" />
        </Button>
      );

    switch (question.type) {
      case "decimal":
      case "integer":
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              value={value?.toString() || ""}
              onChange={(e) => handleNumberChange(e.target.value, index)}
              step={question.type === "decimal" ? "0.01" : "1"}
              {...commonProps}
            />
            {removeButton}
          </div>
        );
      case "choice":
        return (
          <div className="flex gap-2">
            <ChoiceQuestion
              question={question}
              questionnaireResponse={{
                ...questionnaireResponse,
                values: [value],
              }}
              updateQuestionnaireResponseCB={(response) => {
                const updatedValues = [...questionnaireResponse.values];
                updatedValues[index] = response.values[0];
                updateQuestionnaireResponseCB({
                  ...questionnaireResponse,
                  values: updatedValues,
                });
              }}
              disabled={!isEnabled}
            />
            {removeButton}
          </div>
        );
      case "text":
        return (
          <div className="flex gap-2">
            <Textarea
              value={value?.toString() || ""}
              onChange={(e) => {
                const updatedValues = [...questionnaireResponse.values];
                updatedValues[index] = e.target.value;
                updateQuestionnaireResponseCB({
                  ...questionnaireResponse,
                  values: updatedValues,
                });
              }}
              className="min-h-[100px]"
              {...commonProps}
            />
            {removeButton}
          </div>
        );
      case "display":
        return null;
      case "structured":
        switch (question.structured_type) {
          case "medication_request":
            return (
              <MedicationQuestion
                question={question}
                questionnaireResponse={questionnaireResponse}
                updateQuestionnaireResponseCB={updateQuestionnaireResponseCB}
                disabled={!isEnabled}
              />
            );
          case "allergy_intolerance":
            return (
              <AllergyQuestion
                question={question}
                questionnaireResponse={questionnaireResponse}
                updateQuestionnaireResponseCB={updateQuestionnaireResponseCB}
                disabled={!isEnabled}
              />
            );
        }
        return null;
      default:
        return (
          <div className="flex gap-2">
            <Input
              type="text"
              value={value?.toString() || ""}
              onChange={(e) => {
                const updatedValues = [...questionnaireResponse.values];
                updatedValues[index] = e.target.value;
                updateQuestionnaireResponseCB({
                  ...questionnaireResponse,
                  values: updatedValues,
                });
              }}
              {...commonProps}
            />
            {removeButton}
          </div>
        );
    }
  };

  const renderInput = () => {
    if (!questionnaireResponse.values.length) {
      questionnaireResponse.values.push("");
    }

    return (
      <div className="space-y-2">
        {questionnaireResponse.values.map((value, index) => (
          <div key={index}>{renderSingleInput(value, index)}</div>
        ))}
        {question.repeats && (
          <Button
            variant="outline"
            size="sm"
            onClick={addValue}
            className="mt-2"
          >
            <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
            Add Another
          </Button>
        )}
      </div>
    );
  };

  const isEnabled = isQuestionEnabled();
  if (!isEnabled && question.disabled_display === "hidden") {
    return null;
  }

  return (
    <div className={`space-y-2 ${!isEnabled ? "opacity-50" : ""}`}>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">
            {question.text}
            {question.required && <span className="ml-1 text-red-500">*</span>}
          </Label>
        </div>
      </div>
      <div className="space-y-2">{renderInput()}</div>
      <NotesInput
        questionnaireResponse={questionnaireResponse}
        updateQuestionnaireResponseCB={updateQuestionnaireResponseCB}
        disabled={!isEnabled}
      />
    </div>
  );
}
