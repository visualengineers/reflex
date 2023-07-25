// Fill out your copyright notice in the Description page of Project Settings.


#include "DepthPosition.h"

void UDepthPosition::SetValues(FPosition position)
{
	this->X = position.X;
	this->Y = position.Y;
	this->Z = position.Z;
	this->IsFiltered = position.IsFiltered;
	this->IsValid =position.IsValid;
}
