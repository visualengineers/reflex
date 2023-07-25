// Fill out your copyright notice in the Description page of Project Settings.


#include "MessageSerializer.h"

#include "JsonObjectConverter.h"

TArray<UDepthInteraction*>UMessageSerializer::ExtractInteractions(const FString& Message)
{
	TArray<UDepthInteraction*> Result;

	TArray<FInteraction> Deserialized = TArray<FInteraction>();	
		
	// This is supposed to parse the JSON String into the Array of depth interactions
	auto Success = FJsonObjectConverter::JsonArrayStringToUStruct(Message, &Deserialized, 0, 0);
	if (!Success) {
		UE_LOG(LogTemp, Error, TEXT("Serialization not successful: %s"), *Message);
		return Result;
	}	

	for (const auto Interaction : Deserialized)
	{
		auto DepthInteraction = NewObject<UDepthInteraction>();
		DepthInteraction->SetValues(Interaction);
		Result.Add(DepthInteraction);
	} 

	return Result;
}
