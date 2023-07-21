namespace ReFlex.Core.Interactivity.Util
{
    public enum FilterType
    {
        None,
        MovingAverage,
        WeightedMovingAverage,
        SavitzkyGolay,
        PolynomialFit, //  http://140.113.180.222/VSCS-math.html
        WeightedPolynomialFit,
        Butterworth // https://stackoverflow.com/questions/1351689/simple-signal-processing-in-c-sharp
        // Kalman, // Math.NEt:Filtering.Kalman
        // Butterworth2, // https://apps.dtic.mil/sti/pdfs/AD1060538.pdf
        // LevenbergMarquardt,
        // BandPass, 
        // EigenValue,
        //Bandpass2 //https://www.codeproject.com/Tips/5070936/Lowpass-Highpass-and-Bandpass-Butterworth-Filters
    }
}