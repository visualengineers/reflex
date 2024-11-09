using System;
using System.Net.Mime;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NLog;
using ReFlex.Core.Common.Components;
using TrackingServer.Data.Calibration;
using TrackingServer.Data.Config;
using TrackingServer.Model;

namespace TrackingServer.Controllers
{


    [Route("api/[controller]")]
    [ApiController]
    public class CalibrationController : Controller
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        private readonly CalibrationService _calibrationService;

        public CalibrationController(CalibrationService calibrationService)
        {
            _calibrationService = calibrationService;
        }

        // GET: api/Calibration/FrameSize
        [Route("FrameSize")]
        [HttpGet]
        public FrameSizeDefinition GetFrameSize()
        {
            return _calibrationService.Frame;
        }

        // GET: api/Calibration/SourceValues
        [Route("SourceValues")]
        [HttpGet]
        public CalibrationPoint[] GetSourceValues()
        {
            return _calibrationService.SourceValues;
        }

        // GET: api/Calibration/TargetValues
        [Route("TargetValues")]
        [HttpGet]
        public CalibrationPoint[] GetTargetValues()
        {
            return _calibrationService.TargetValues;
        }

        // GET: api/Calibration/GetCalibrationMatrix
        [Route("GetCalibrationMatrix")]
        [HttpGet]
        public ActionResult<CalibrationTransform> GetCalibrationMatrix()
        {
            _calibrationService.ComputeTransformation();

            var result = _calibrationService.TransformationMatrix;

            return new ActionResult<CalibrationTransform>(new CalibrationTransform { Transformation = CleanupTransformationMatrix(result) });
        }

        // GET: api/Calibration/ApplyCalibration
        [Route("ApplyCalibration")]
        [HttpGet]
        public ActionResult<CalibrationTransform> ApplyCalibration()
        {
            // TODO: something to validate ?
            _calibrationService.ComputeTransformation();

            var result = _calibrationService.TransformationMatrix;

            return new ActionResult<CalibrationTransform>(new CalibrationTransform { Transformation = CleanupTransformationMatrix(result) });
        }

        // GET: api/Calibration/Restart
        [Route("Restart")]
        [HttpGet]
        public ActionResult<CalibrationTransform> RestartCalibration()
        {
            _calibrationService.RestartCalibration();

            var result = _calibrationService.TransformationMatrix;

            return new ActionResult<CalibrationTransform>(new CalibrationTransform { Transformation = CleanupTransformationMatrix(result) });
        }

        // GET: api/Calibration/SaveCalibration
        [Route("SaveCalibration")]
        [HttpGet]
        public ActionResult<CalibrationTransform> SaveCalibration()
        {
            // TODO: something to validate ?
            _calibrationService.FinishCalibration();

            var result = _calibrationService.TransformationMatrix;

            return new ActionResult<CalibrationTransform>(new CalibrationTransform { Transformation = CleanupTransformationMatrix(result) });
        }

        // POST: api/Calibration/UpdateFrameSize
        [HttpPost("UpdateFrameSize")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<FrameSizeDefinition> UpdateFrameSize([FromBody] FrameSizeDefinition size)
        {
            if (size == null)
                return BadRequest(
                    $"Invalid {nameof(FrameSizeDefinition)} for Calibration provided in {GetType().Name}.{nameof(UpdateFrameSize)}().");

            var result = _calibrationService.SetWindowFrame(size);
            return new ActionResult<FrameSizeDefinition>(result);
        }

        // POST: api/Calibration/UpdateCalibrationPoint/{index}
        [HttpPost("UpdateCalibrationPoint/{index}")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<CalibrationTransform> UpdateCalibrationPoint(int index, [FromBody] CalibrationPoint targetValue)
        {
            var msg = "";
            var isValid = true;

            if (index < 0 || index > 2)
            {
                msg = $"Invalid index for calibration point in {GetType().Name}.{nameof(UpdateCalibrationPoint)}().. Provided Index is '{index}' but must be between 0 and 2.";
                isValid = false;
            }

            isValid = ValidateCalibrationPoint(targetValue, out var error) && isValid;

            if (!isValid)
            {
                Logger.Error(msg + error);
                return BadRequest(msg);
            }

            _calibrationService.UpdateCalibration(index, targetValue.PositionX, targetValue.PositionY, targetValue.TouchId);

            var result = _calibrationService.TransformationMatrix;

            return new ActionResult<CalibrationTransform>(new CalibrationTransform { Transformation = CleanupTransformationMatrix(result) });
        }

        // POST: api/Calibration/AddCalibrationPoint
        [HttpPost("AddCalibrationPoint")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<CalibrationTransform> AddCalibrationPoint([FromBody] CalibrationPoint targetValue)
        {
            var isValid = ValidateCalibrationPoint(targetValue, out var msg);

            if (!isValid)
            {
                Logger.Error(msg);
                return BadRequest(msg);
            }

            _calibrationService.AddCalibrationPoint(targetValue.PositionX, targetValue.PositionY, targetValue.TouchId);

            var result = _calibrationService.TransformationMatrix;

            return new ActionResult<CalibrationTransform>(new CalibrationTransform { Transformation = CleanupTransformationMatrix(result) });
        }

        // POST: api/Calibration/CalibratedInteractions
        [HttpPost("CalibratedInteractions")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<Interaction[]> GetCalibratedInteractions([FromBody] Interaction[] interactions)
        {
            if (interactions?.Length == null)
                return BadRequest(
                    $"Invalid {nameof(interactions)} for Calibration provided in {GetType().Name}.{nameof(GetCalibratedInteractions)}().");


            var result = _calibrationService.GetCalibratedInteractions(interactions);
            return new ActionResult<Interaction[]>(result);
        }

        // // POST: api/Calibration/CalibratedInteractions
        // [HttpPost("CalibratedInteractions")]
        // [Consumes(MediaTypeNames.Application.Json)]
        // [ProducesResponseType(StatusCodes.Status200OK)]
        // [ProducesResponseType(StatusCodes.Status400BadRequest)]
        // public ActionResult<Interaction[]> GetCalibratedInteractions([FromBody] LegacyInteraction[] interactions)
        // {
        //     if (interactions?.Length == null)
        //         return BadRequest(
        //             $"Invalid {nameof(interactions)} for Calibration provided in {GetType().Name}.{nameof(GetCalibratedInteractions)}().");
        //
        //
        //     var result = _calibrationService.GetCalibratedInteractions(interactions.Select((legacyInteraction) => new Interaction(legacyInteraction)));
        //     return new ActionResult<Interaction[]>(result);
        // }

        private bool ValidateCalibrationPoint(CalibrationPoint targetValue, out string msg)
        {
            msg = "";

            var isValid = true;

            if (targetValue == null)
            {
                msg =
                    $"No targetValue for Calibration provided in {GetType().Name}.{nameof(ValidateCalibrationPoint)}().";
                isValid = false;
            }
            else
            {
                isValid =
                    _calibrationService.ValidateTargetPoint(targetValue.PositionX, targetValue.PositionY,
                        out var error);

                if (!isValid)
                {
                    msg = $"Invalid target value for {GetType().Name}.{nameof(ValidateCalibrationPoint)}(): {error}";
                }
            }

            return isValid;
        }

        private static float[,] CleanupTransformationMatrix(float[,] source)
        {
            var result = new float[source.GetLength(0), source.GetLength(1)];

            for (var i = 0; i < source.GetLength(0); i++)
            {
                for (var j = 0; j < source.GetLength(1); j++)
                {
                    result[i, j] = float.IsNormal(source[i, j])
                        ? source[i, j]
                        : 0;
                }
            }

            return result;
        }
    }
}