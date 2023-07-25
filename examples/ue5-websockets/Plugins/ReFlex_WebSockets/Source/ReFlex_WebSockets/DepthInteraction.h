// Fill out your copyright notice in the Description page of Project Settings.

#pragma once

#include "CoreMinimal.h"
#include "DepthPosition.h"
#include "ExtremumDescriptionValue.h"
#include "FInteraction.h"
#include "UObject/Object.h"
#include "DepthInteraction.generated.h"

/**
 * 
 */
UCLASS(BlueprintType, Category="ReFlex|Data")
class REFLEX_WEBSOCKETS_API UDepthInteraction : public UObject
{
	GENERATED_BODY()

public:
	UPROPERTY(BlueprintReadOnly, Category="ReFlex|Data")
	int32 TouchId;

	UPROPERTY(BlueprintReadOnly, Category="ReFlex|Data")
	UDepthPosition* Position;

	UPROPERTY(BlueprintReadOnly, Category="ReFlex|Data")
	int32 Type;

	UPROPERTY(BlueprintReadOnly, Category="ReFlex|Data")
	UExtremumDescriptionValue* ExtremumDescription;

	UPROPERTY(BlueprintReadOnly, Category="ReFlex|Data")
	float Confidence;

	UPROPERTY(BlueprintReadOnly, Category="ReFlex|Data")
	int32 Time;

	void SetValues(FInteraction Interaction);
};
