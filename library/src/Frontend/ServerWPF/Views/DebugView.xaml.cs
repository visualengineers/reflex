using System;
using CommonServiceLocator;
using Implementation.Interfaces;
using Prism.Ioc;
using Prism.Unity;
using ReFlex.Core.Common.Components;
using ReFlex.Frontend.ServerWPF.Util;
using SharpGL;
using SharpGL.SceneGraph;
using SharpGL.WPF;
using Unity;

namespace ReFlex.Frontend.ServerWPF.Views
{
    public partial class DebugView
    {
        private readonly IDepthImageManager _depthImageManager;
        private readonly RenderContext _context;

        private OpenGL _openGl;      
        private PointCloud3 _pointcloud;
        private VectorField2 _vectorfield;
        private Vector3 _translation, _rotation;

        public DebugView()
        {
            InitializeComponent();
            _context = RenderContext.Pointcloud;
            _depthImageManager = ContainerLocator.Container.Resolve<IDepthImageManager>();
        }

        private void OnOpenGlInitialized(object sender, OpenGLRoutedEventArgs openGlRoutedEventArgs)
        {
            _translation = new Vector3(0, 0, 1);
            _rotation = new Vector3(0, 0, 0);

            _openGl = openGlRoutedEventArgs.OpenGL;
            _openGl.Color(0.12f, 0.12f, 0.12f, 1.0f);
            _openGl.Clear(OpenGL.GL_COLOR_BUFFER_BIT | OpenGL.GL_DEPTH_BUFFER_BIT);
            _openGl.Enable(OpenGL.GL_POINT_SIZE);
        }

        private void OnOpenGlResized(object sender, OpenGLRoutedEventArgs openGlRoutedEventArgs)
        {
            _openGl.Clear(OpenGL.GL_COLOR_BUFFER_BIT | OpenGL.GL_DEPTH_BUFFER_BIT);
        }

        private void OnOpenGlDraw(object sender, OpenGLRoutedEventArgs openGlRoutedEventArgs)
        {
            if(_depthImageManager is null)
                return;

            _openGl = openGlRoutedEventArgs.OpenGL;
            _openGl.Clear(OpenGL.GL_COLOR_BUFFER_BIT | OpenGL.GL_DEPTH_BUFFER_BIT);
            _openGl.LoadIdentity();

            _openGl.Scale(_translation.Z, _translation.Z, 0);
            _openGl.Rotate(_rotation.X, _rotation.Y, _rotation.Z);

            _openGl.Color(0.12f, 0.12f, 0.12f, 1.0f);

            switch (_context)
            {
                case RenderContext.Pointcloud:
                    DrawPointcloud();
                    break;
                case RenderContext.Vectorfield:
                    DrawVectorfield();
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }

            _openGl.Flush();
        }

        private void DrawPointcloud()
        {
            _pointcloud = _depthImageManager?.PointCloud;
            if (_pointcloud is null)
                return;

            _openGl.Begin(OpenGL.GL_POINTS);

            for (var i = 0; i < _pointcloud.Size; i += 10)
            {
                var point = _pointcloud.AsArray()[i];

                if (point.IsValid)
                    _openGl.Color(0.0f, 1.0f, 0.0f);
                else
                    _openGl.Color(1.0f, 0.0f, 0.0f);

                _openGl.Vertex(point.X, point.Y, point.Z);
            }

            _openGl.End();
        }

        private void DrawVectorfield()
        {
            _pointcloud = _depthImageManager?.PointCloud;
            _vectorfield = _depthImageManager?.VectorField;
            if (_vectorfield is null || _pointcloud is null)
                return;

            _openGl.Begin(OpenGL.GL_LINES);

            for (var i = 0; i < _vectorfield.Size; i += 10)
            {
                var point = _pointcloud.AsArray()[i];
                var vector = _vectorfield.AsArray()[i];
                var ln = vector.NormalizedCopy;

                _openGl.Color(ln.X, ln.Y, 1f);
                _openGl.Vertex(point.X, point.Y, point.Z);
                _openGl.Vertex(point.X + vector.X, point.Y + vector.Y, point.Z);
            }

            _openGl.End();
        }
    }
}
