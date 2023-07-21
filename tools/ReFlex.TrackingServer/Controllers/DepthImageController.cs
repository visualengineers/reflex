using Implementation.Interfaces;
using Microsoft.AspNetCore.Mvc;
using ReFlex.Core.Common.Components;

namespace TrackingServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepthImageController : ControllerBase
    {
        private readonly IDepthImageManager _depthImgMgr;

        public DepthImageController(IDepthImageManager depthImageManager)
        {
            _depthImgMgr = depthImageManager;
        }

        // GET: api/DepthImage/PointCloud
        [Route("PointCloud")]
        [HttpGet]
        public Point3[] GetPointCloud()
        {
            return _depthImgMgr?.PointCloud?.AsArray() ?? new Point3[0];
        }

        // GET: api/DepthImage/VectorField
        [Route("VectorField")]
        [HttpGet]
        public Vector2[][] GetVectorField()
        {
            return _depthImgMgr?.VectorField?.AsJaggedArray() ?? new Vector2[0][];
        }
    }
}
