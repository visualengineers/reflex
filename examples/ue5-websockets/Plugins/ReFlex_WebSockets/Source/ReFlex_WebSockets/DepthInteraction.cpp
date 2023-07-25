// Fill out your copyright notice in the Description page of Project Settings.


#include "DepthInteraction.h"

#include "ExtremumDescriptionValue.h"

void UDepthInteraction::SetValues(FInteraction Interaction)
{
	this->TouchId = Interaction.TouchId;
	this->Type = Interaction.Type;

	this->Position = NewObject<UDepthPosition>();
	this->Position->SetValues(Interaction.Position);

	this->ExtremumDescription = NewObject<UExtremumDescriptionValue>();
	this->ExtremumDescription->SetValues(Interaction.ExtremumDescription);

	this->Confidence = Interaction.Confidence;
	this->Time = Interaction.Time;
}
