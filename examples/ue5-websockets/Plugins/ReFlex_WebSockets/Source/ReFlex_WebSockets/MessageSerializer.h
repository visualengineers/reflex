// Fill out your copyright notice in the Description page of Project Settings.

#pragma once

#include "CoreMinimal.h"
#include "DepthInteraction.h"
#include "UObject/Object.h"
#include "MessageSerializer.generated.h"

/**
 * 
 */
UCLASS(BlueprintType, Category="ReFlex|Serialization")
class REFLEX_WEBSOCKETS_API UMessageSerializer : public UObject
{
	GENERATED_BODY()

public:
	UFUNCTION(BlueprintCallable, Category="ReFlex|Serialization")
	TArray<UDepthInteraction*> ExtractInteractions(const FString& Message);
};
