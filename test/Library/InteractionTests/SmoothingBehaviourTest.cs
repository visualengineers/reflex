using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Util;
using Interaction = ReFlex.Core.Common.Components.Interaction;
using Math = System.Math;

namespace InteractionTests
{
    public class SmoothingBehaviourTest
    {
        private InteractionSmoothingBehaviour _smoothing;
        private const int NumFrames = 10;
        private const float SquaredDistance = 64f;
        // private SimpleMovingAverageFilter _movingAverageFilter = new SimpleMovingAverageFilter(5);

        private readonly List<Interaction> _testInteractions = new ()
        {
            new Interaction(new Point3(100f, 200f, 0.5f), InteractionType.Push, 10f),
            new Interaction(new Point3(105f, 195f, 0.5f), InteractionType.Push, 10f), // rather close to the first
            new Interaction(new Point3(105f, 95f, 0.5f), InteractionType.Push, 10f), // far away in one direction from [0] and [1]
            new Interaction(new Point3(115f, 135f, 0.5f), InteractionType.Push, 10f) // between [1] and [2], but out of the distance to [0]
        };
        
        [SetUp]
        public void Setup()
        {
            _smoothing = new InteractionSmoothingBehaviour(NumFrames);
            _smoothing.TouchMergeDistance2D = SquaredDistance;
            _smoothing.NumFramesSmoothing = 0;
            _smoothing.MaxNumEmptyFramesBetween = 3;
            _smoothing.UpdateFilterType(FilterType.None);
        }

        /// <summary>
        /// Add different interactions that are not merged into one and check if they are removed correctly base on their "life span" (cf. <see cref="InteractionSmoothingBehaviour.MaxNumEmptyFramesBetween"/>
        /// </summary>
        [Test]
        public void TestDifferentWidePointsAndReset()
        {
            var cache = new List<InteractionFrame>();
            
            var confidence = new List<int>();
            var touchIds = new List<int>();
            
            for (var i = 0; i < 20; i++)
            {
                var desc = new ExtremumDescription
                    { Type = ExtremumType.Maximum, NumFittingPoints = 1, PercentageFittingPoints = 1 }; 
                
                var interaction = new Interaction(new Point3(SquaredDistance * i, i, -0.5f), InteractionType.Pull, 0);
                interaction.Time = DateTime.Now.Ticks;

                var sourceInteractions = new List<Interaction> {interaction};

                Assert.That(_smoothing.InteractionsFramesCache.Length, Is.EqualTo(cache.Count));
                ValidateCache(cache);
                
                var result = _smoothing.Update(sourceInteractions);

                var expectedFrameId = i + 1;
                var expectedMaxId = i + 1;

                var interactionsCount = Math.Min(Math.Min(i + 1, NumFrames), _smoothing.MaxNumEmptyFramesBetween + 1);
                
                confidence.Add(0);
                if (interactionsCount < expectedFrameId)
                    touchIds.RemoveAt(0);
                
                touchIds.Add(i);

                var cachedFrame = new InteractionFrame(result.FrameId,
                    result.Interactions.Where(inter => inter.TouchId == i).ToList());
                
                cache.Add(cachedFrame);
                
                if (i >= NumFrames)
                {
                    confidence = confidence.TakeLast(NumFrames).ToList();
                    touchIds = touchIds.TakeLast(NumFrames).ToList();
                    cache = cache.TakeLast(NumFrames).ToList();
                }
                
                var cacheSize = Math.Min(i + 1, NumFrames);

                CheckResult(result, interactionsCount, expectedFrameId, confidence, touchIds, expectedMaxId, cacheSize);

                ValidateCache(cache);
                
                
            }
            _smoothing.Reset();
                             
           cache.Clear();

           ValidateCache(cache);

            Assert.Multiple(() =>
            {
                Assert.That(_smoothing.CurrentMaxId, Is.EqualTo(0));
                Assert.That(_smoothing.CurrentFrameId, Is.EqualTo(0));
            });
        }

        
        /// <summary>
        /// Tests if a single interaction processed in 100 frames is returned having assigned the correct unique id and correct confidence
        /// Also verifies the cache correctness
        /// </summary>
        [Test]
        public void TestSingleInteractionNoHistory()
        {
            _smoothing.MaxConfidence = new Random().Next(100);

           for (var i = 0; i < 100; i++)
           {
                Thread.Sleep(20);
                var sourceInteractions = GetTestData(1, 0);       
                
                var result = _smoothing.Update(sourceInteractions);

                var expectedFrameId = i + 1;
                var expectedMaxId = 1;

                var interactionsCount = 1;
                var confidence = new List<int> {Math.Min(i, _smoothing.MaxConfidence)};
                var touchIds = new List<int> {0};
                
                var cacheSize = Math.Min(i + 1, NumFrames);

                var interactions = sourceInteractions;
                
                CheckResult(result, interactionsCount, expectedFrameId, confidence, touchIds, expectedMaxId, cacheSize);

                Assert.That(_smoothing.InteractionsFramesCache.ToList().TrueForAll(frame => frame.Interactions.Count == interactionsCount), Is.True);

                Assert.That(_smoothing.InteractionsFramesCache.ToList().TrueForAll(frame => 
                    ValidateInteractionInFrame(interactions[0], new List<Interaction> {frame.Interactions[0]})), Is.True);
                
           }
        }
        
        /// <summary>
        /// Tests if to parallel touches are correctly tracked over 100 frames (when being consistently reported) by associating consistent Ids 
        /// </summary>
        [Test]
        public void TestTwoCloseInteractionsNoHistory()
        {
            var interactionsCount = 2;

            _smoothing.MaxConfidence = new Random().Next(100);
            
            for (var i = 0; i < 100; i++)
            {
                Thread.Sleep(20);
                var sourceInteractions = GetTestData(2, 0);
                
                var result = _smoothing.Update(sourceInteractions);

                var expectedFrameId = i + 1;
                var expectedMaxId = 2;

                var conf = Math.Min(i, _smoothing.MaxConfidence);
                var confidence = new List<int> {conf, conf};
                var touchIds = new List<int> {0, 1};
                
                var cacheSize = Math.Min(i + 1, NumFrames);

                var interactions = sourceInteractions;
                
                CheckResult(result, interactionsCount, expectedFrameId, confidence, touchIds, expectedMaxId, cacheSize);

                var orderPreserved = true;
                
                var map1 = result.Interactions.FirstOrDefault(interaction => interaction.TouchId == 0);
                var map2 = result.Interactions.FirstOrDefault(interaction => interaction.TouchId == 1);
                Tuple<Interaction, Interaction> check1, check2;

                if (i == 0)
                {
                    // check if order is preserved in the first frame: should be true, but not really important 
                    orderPreserved = ValidateInteractionMapping(sourceInteractions[0], map1);
                }

                if (orderPreserved)
                {
                    check1 = Tuple.Create(sourceInteractions[0], map1);
                    check2 = Tuple.Create(sourceInteractions[1], map2);
                }
                else
                {
                    check1 = Tuple.Create(sourceInteractions[0], map2);
                    check2 = Tuple.Create(sourceInteractions[1], map1);
                }

                Assert.Multiple(() =>
                {
                    Assert.That(ValidateInteractionMapping(check1.Item1, check1.Item2), Is.True);
                    Assert.That(ValidateInteractionMapping(check2.Item1, check2.Item2), Is.True);


                    Assert.That(_smoothing.InteractionsFramesCache.ToList().TrueForAll(frame => frame.Interactions.Count == interactionsCount), Is.True);

                    Assert.That(_smoothing.InteractionsFramesCache.ToList().TrueForAll(frame =>
                        ValidateInteractionInFrame(interactions[0], new List<Interaction> { frame.Interactions[0] })), Is.True);
                });
            }
        }
        
        
        /// <summary>
        /// tests if two interactions are still correctly recognized and associated with an empty frame between them.
        /// Positions are always reported together in one frame 
        /// </summary>
        [Test]
        public void TestTwoCloseInteractionsWithEmptyFrameInHistory()
        {
            var data = GetTestData(2);

            var interaction1 = data[0];
            var interaction2 = data[1];

            // interactions should be acknowledged as two !
            var sourceInteractions = new List<Interaction> {interaction1, interaction2};
            var result = _smoothing.Update(sourceInteractions);
            
            var confidence = new List<int> {0, 0};
            var touchIds = new List<int> {0, 1};
            
            CheckResult(result, 2, 1, confidence, touchIds, 2, 1);
            
            var map1 = result.Interactions.FirstOrDefault(interaction => interaction.TouchId == 0);
            var map2 = result.Interactions.FirstOrDefault(interaction => interaction.TouchId == 1);

            Tuple<Interaction, Interaction> check1, check2; 
            
            // should be true, but not really important
            var orderPreserved = ValidateInteractionMapping(interaction1, map1);
            
            if (orderPreserved)
            {
                check1 = Tuple.Create(interaction1, map1);
                check2 = Tuple.Create(interaction2, map2);
            }
            else
            {
                check1 = Tuple.Create(interaction1, map2);
                check2 = Tuple.Create(interaction2, map1);
            }

            Assert.Multiple(() =>
            {
                Assert.That(ValidateInteractionMapping(check1.Item1, check1.Item2), Is.True);
                Assert.That(ValidateInteractionMapping(check2.Item1, check2.Item2), Is.True);
            });

            var result2 = _smoothing.Update(new List<Interaction>());
            
            CheckResult(result2, 2, 2, confidence, touchIds, 2, 2);
            
            map1 = result2.Interactions.FirstOrDefault(interaction => interaction.TouchId == 0);
            map2 = result2.Interactions.FirstOrDefault(interaction => interaction.TouchId == 1);
            
            // now the ids should not be changed..
            if (orderPreserved)
            {
                check1 = Tuple.Create(interaction1, map1);
                check2 = Tuple.Create(interaction2, map2);
            }
            else
            {
                check1 = Tuple.Create(interaction1, map2);
                check2 = Tuple.Create(interaction2, map1);
            }

            Assert.Multiple(() =>
            {
                Assert.That(ValidateInteractionMapping(check1.Item1, check1.Item2), Is.True);
                Assert.That(ValidateInteractionMapping(check2.Item1, check2.Item2), Is.True);
            });

        }
        
        /// <summary>
        /// tests, if interactions that are beyond the merge distance are not merged together
        /// [1]: [105|195|0.5]  (a)
        /// [2]: [115|135|0.5]  (c)
        /// [3]: [105| 95|0.5]  (b)  
        /// distance: 45 (a-b: 70, a-c:120, b-c:50) 
        /// expect three interactions to be recognized
        /// </summary>
        [Test]
        public void TestInteractionsInLineNoMergeNoRemove()
        {
            _smoothing.TouchMergeDistance2D = 45f;
            _smoothing.MaxConfidence = 100;
            _smoothing.MaxNumEmptyFramesBetween = 2;

            var data1 = GetTestData(new[]{1});
            var interaction1 = data1[0];
           
            var result = _smoothing.Update(data1);
            
            var confidence = new List<int> {0};
            var touchIds = new List<int> {0};
            
            CheckResult(result, 1, 1, confidence, touchIds, 1, 1);

            Assert.That(ValidateInteractionMapping(interaction1, result.Interactions[0]), Is.True);
            
            var data2 = GetTestData(new[]{3});

            var interaction2 = new Interaction(data2[0]); //ApplyFilter(new List<Interaction> {data2[0], data1[0]});

            result = _smoothing.Update(data2);            

            confidence = new List<int> {0,0};
            touchIds = new List<int> {0,1};
            
            CheckResult(result, 2, 2, confidence, touchIds, 2, 2);

            Assert.Multiple(() =>
            {
                Assert.That(ValidateInteractionMapping(interaction1, result.Interactions[0]), Is.True);
                Assert.That(ValidateInteractionMapping(interaction2, result.Interactions[1]), Is.True);
            });

            var data3 = GetTestData(new[]{2});
            var interaction3 = new Interaction(data3[0]); // ApplyFilter(new List<Interaction> {data3[0], data2[0], data1[0]});
            
            result = _smoothing.Update(data3);
            
            confidence = new List<int> {0 ,0, 0};
            touchIds = new List<int> {0, 1, 2};
            
            CheckResult(result, 3, 3, confidence, touchIds, 3, 3);

            Assert.Multiple(() =>
            {
                Assert.That(ValidateInteractionMapping(interaction1, result.Interactions[0]), Is.True);
                Assert.That(ValidateInteractionMapping(interaction2, result.Interactions[1]), Is.True);
                Assert.That(ValidateInteractionMapping(interaction3, result.Interactions[2]), Is.True);
            });
        }

        /// <summary>
        /// tests, if interactions that are beyond the merge distance are not merged together
        /// [1]: [105|195|0.5]  (a)
        /// [2]: [115|135|0.5]  (c)
        /// [3]: [105| 95|0.5]  (b)  
        /// distance: 45 (a-b: 70, a-c:120, b-c:50) 
        /// expect two interactions to be recognized, as first one is removed in third frame
        /// </summary>
        [Test]
        public void TestInteractionsInLineNoMergeWithRemove()
        {
            _smoothing.TouchMergeDistance2D = 45f;
            _smoothing.MaxConfidence = 100;
            _smoothing.MaxNumEmptyFramesBetween = 1;

            var data1 = GetTestData(new[]{1});
            var interaction1 = data1[0];
           
            var result = _smoothing.Update(data1);
            
            var confidence = new List<int> {0};
            var touchIds = new List<int> {0};
            
            CheckResult(result, 1, 1, confidence, touchIds, 1, 1);

            Assert.That(ValidateInteractionMapping(interaction1, result.Interactions[0]), Is.True);
            
            var data2 = GetTestData(new[]{3});

            var interaction2 = new Interaction(data2[0]); //ApplyFilter(new List<Interaction> {data2[0], data1[0]});

            result = _smoothing.Update(data2);            

            confidence = new List<int> {0,0};
            touchIds = new List<int> {0,1};
            
            CheckResult(result, 2, 2, confidence, touchIds, 2, 2);

            Assert.Multiple(() =>
            {
                Assert.That(ValidateInteractionMapping(interaction1, result.Interactions[0]), Is.True);
                Assert.That(ValidateInteractionMapping(interaction2, result.Interactions[1]), Is.True);
            });

            var data3 = GetTestData(new[]{2});
            var interaction3 = new Interaction(data3[0]); // ApplyFilter(new List<Interaction> {data3[0], data2[0], data1[0]});
            
            result = _smoothing.Update(data3);
            
            // MaxNumEmptyFramesBetween = 1 --> remove first touch
            confidence = new List<int> {0 ,0};
            touchIds = new List<int> {1, 2};
            
            CheckResult(result, 2, 3, confidence, touchIds, 3, 3);

            Assert.Multiple(() =>
            {
                Assert.That(ValidateInteractionMapping(interaction2, result.Interactions[0]), Is.True);
                Assert.That(ValidateInteractionMapping(interaction3, result.Interactions[1]), Is.True);
            });
        }

        /// <summary>
        /// tests, if interactions that are beyond the merge distance are not merged together
        /// [1]: [105|195|0.5]  (a)
        /// [2]: [115|135|0.5]  (c)
        /// [3]: [105| 95|0.5]  (b)  
        /// distance: 45 (a-b: 70, a-c:120, b-c:50) 
        /// expect two interactions to be recognized, as first one is removed in third frame
        /// </summary>
        [Test]
        public void TestInteractionsInLineWithMergeNoRemove()
        {
            _smoothing.TouchMergeDistance2D = 65f;
            _smoothing.MaxConfidence = 100;
            _smoothing.MaxNumEmptyFramesBetween = 2;

            var data1 = GetTestData(new[]{1});
            var interaction1 = data1[0];
           
            var result = _smoothing.Update(data1);
            
            var confidence = new List<int> {0};
            var touchIds = new List<int> {0};
            
            CheckResult(result, 1, 1, confidence, touchIds, 1, 1);

            Assert.That(ValidateInteractionMapping(interaction1, result.Interactions[0]), Is.True);
            
            var data2 = GetTestData(new[]{3});

            var interaction2 = new Interaction(data2[0]); //ApplyFilter(new List<Interaction> {data2[0], data1[0]});

            result = _smoothing.Update(data2);            

            confidence = new List<int> {0,0};
            touchIds = new List<int> {0,1};
            
            CheckResult(result, 2, 2, confidence, touchIds, 2, 2);

            Assert.Multiple(() =>
            {
                Assert.That(ValidateInteractionMapping(interaction1, result.Interactions[0]), Is.True);
                Assert.That(ValidateInteractionMapping(interaction2, result.Interactions[1]), Is.True);
            });

            var data3 = GetTestData(new[]{2});
            var interaction3 = new Interaction(data3[0]); // ApplyFilter(new List<Interaction> {data3[0], data2[0], data1[0]});
            
            result = _smoothing.Update(data3);
            
            // Touch mergeDistance = 65 -> third touch is mapped to touchId 1 (with position of touch 3)
            confidence = new List<int> {0 , 1};
            touchIds = new List<int> {0, 1};
            
            CheckResult(result, 2, 3, confidence, touchIds, 2, 3);

            Assert.Multiple(() =>
            {
                Assert.That(ValidateInteractionMapping(interaction1, result.Interactions[0]), Is.True);
                Assert.That(ValidateInteractionMapping(interaction3, result.Interactions[1]), Is.True);
            });
        }

        /// <summary>
        /// tests, if interactions that are beyond the merge distance are not merged together
        /// [1]: [105|195|0.5]  (a)
        /// [2]: [115|135|0.5]  (c)
        /// [3]: [105| 95|0.5]  (b)  
        /// distance: 45 (a-b: 70, a-c:120, b-c:50) 
        /// expect two interactions to be recognized, as first one is removed in third frame
        /// </summary>
        [Test]
        public void TestInteractionsInLineWithMergeWithRemove()
        {
            _smoothing.TouchMergeDistance2D = 65f;
            _smoothing.MaxConfidence = 100;
            _smoothing.MaxNumEmptyFramesBetween = 1;

            var data1 = GetTestData(new[]{1});
            var interaction1 = data1[0];
           
            var result = _smoothing.Update(data1);
            
            var confidence = new List<int> {0};
            var touchIds = new List<int> {0};
            
            CheckResult(result, 1, 1, confidence, touchIds, 1, 1);

            Assert.That(ValidateInteractionMapping(interaction1, result.Interactions[0]), Is.True);
            
            var data2 = GetTestData(new[]{3});

            var interaction2 = new Interaction(data2[0]); //ApplyFilter(new List<Interaction> {data2[0], data1[0]});

            result = _smoothing.Update(data2);            

            confidence = new List<int> {0,0};
            touchIds = new List<int> {0,1};
            
            CheckResult(result, 2, 2, confidence, touchIds, 2, 2);

            Assert.Multiple(() =>
            {
                Assert.That(ValidateInteractionMapping(interaction1, result.Interactions[0]), Is.True);
                Assert.That(ValidateInteractionMapping(interaction2, result.Interactions[1]), Is.True);
            });

            var data3 = GetTestData(new[]{2});
            var interaction3 = new Interaction(data3[0]); // ApplyFilter(new List<Interaction> {data3[0], data2[0], data1[0]});
            
            result = _smoothing.Update(data3);
            
            // TouchMergeDistance = 65 -> third touch is mapped to touchId 1 (with position of touch 3)
            // MaxNumTouchesBetween = 1 -> first touch is also removed
            confidence = new List<int> {1};
            touchIds = new List<int> {1};
            
            CheckResult(result, 1, 3, confidence, touchIds, 2, 3);

            Assert.That(ValidateInteractionMapping(interaction3, result.Interactions[0]), Is.True);
        }
        
        /// <summary>
        /// Tests if a touch point is still correctly recognized and the correct Touch Id returned if a single empty frame is added
        /// </summary>
        [Test]
        public void TestSingleInteractionHistoryWithEmptyFrame()
        {
           
            var sourceInteractions = GetTestData();
            var result = _smoothing.Update(sourceInteractions);
            var confidence = new List<int> {0};
            var touchIds = new List<int> {0};
            
            CheckResult(result, 1, 1, confidence, touchIds, 1, 1);

            var result2 = _smoothing.Update(new List<Interaction>());
            
            CheckResult(result2, 1, 2, confidence, touchIds, 1, 2);
        }
        
        /// <summary>
        /// Tests if a touch point is still correctly recognized ans the correct Touch Id returned if a single empty frame is inserted between to frames 
        /// </summary>
        [Test]
        public void TestSingleInteractionHistoryWithEmptyFrameBetween()
        {
            var sourceInteractions = GetTestData();
            var result = _smoothing.Update(sourceInteractions);
            var confidence = new List<int> {0};
            var touchIds = new List<int> {0};
            
            CheckResult(result, 1, 1, confidence, touchIds, 1, 1);
            
            var result2 = _smoothing.Update(new List<Interaction>());
            
            CheckResult(result2, 1, 2, confidence, touchIds, 1, 2);

            sourceInteractions = GetTestData();

            Assert.That(sourceInteractions[0].TouchId, Is.EqualTo(-1));
            
            var result3 = _smoothing.Update(sourceInteractions);
            
            CheckResult(result3, 1, 3, confidence, touchIds, 1, 3);
        }
        
        /// <summary>
        /// Tests if a touch point is still correctly recognized ans the correct Touch Id returned if it is only present in the first and last frame of the cache, and all other frames containing no interactions 
        /// </summary>
        [Test]
        public void TestSingleInteractionHistoryWithEmptyFramesBetween()
        {
            var sourceInteractions = GetTestData();
            var result = _smoothing.Update(sourceInteractions);
            var confidence = new List<int> {0};
            var touchIds = new List<int> {0};
            
            CheckResult(result, 1, 1, confidence, touchIds, 1, 1);
            
            for (var i = 1; i < NumFrames-1; i++)
            {
                 var result2 = _smoothing.Update(new List<Interaction>());
                 
                 if (result2.FrameId - 1 <= _smoothing.MaxNumEmptyFramesBetween)
                     CheckResult(result2, 1, i+1, confidence, touchIds, 1, i+1);
                 else
                     CheckResult(result2, 0, i+1, new List<int>(), new List<int>(), 1, i+1);
            }
            
            sourceInteractions = GetTestData();

            Assert.That(sourceInteractions[0].TouchId, Is.EqualTo(-1));
            
            var result3 = _smoothing.Update(sourceInteractions);
            
            CheckResult(result3, 1, NumFrames, confidence, touchIds, 1, NumFrames);
        }
        
        private List<Interaction> GetTestData(int count = 1, int confidence = 0)
        {
            var result = new List<Interaction>();
            
            for (var i = 0; i < count; i++)
            {
                result.Add(new Interaction(_testInteractions[i])
                {
                    Confidence = confidence,
                    Time = DateTime.Now.Ticks
                });
            }

            return result;
        }
        
        private List<Interaction> GetTestData(int[] indices, int confidence = 0)
        {
            if (indices == null) 
                throw new ArgumentNullException(nameof(indices));
            
            var result = new List<Interaction>();
            
            foreach (var index in indices)
            {
                if (index >= _testInteractions.Count)
                    continue;
                    
                result.Add(new Interaction(_testInteractions[index]) {
                    Confidence = confidence,
                    Time = DateTime.Now.Ticks
                });
            }

            return result;
        }

        // private Interaction ApplyFilter(List<Interaction> sourceList)
        // {
        //     return sourceList?.LastOrDefault();
        //     
        //     // if (sourceList == null || sourceList.Count == 0)
        //     //     return null;
        //     //
        //     //
        //     // return new Interaction(_movingAverageFilter.Process(sourceList.Select(interaction => interaction.Position).ToList()).First(), sourceList[0]);
        // }

        private void CheckResult(
            InteractionFrame result,
            int interactionsCount,
            int frameId,
            List<int> confidence,
            List<int> touchIds,
            int maxId,
            int cacheSize)
        {
            Assert.Multiple(() =>
            {
                Assert.That(result.FrameId, Is.EqualTo(frameId));
                Assert.That(result.Interactions.Count, Is.EqualTo(interactionsCount));
            });

            for (var i = 0; i < result.Interactions.Count; i++)
            {
                var interaction = result.Interactions[i];
                Assert.Multiple(() =>
                {
                    Assert.That(interaction.Confidence, Is.EqualTo(confidence[i]));
                    Assert.That(result.Interactions.FirstOrDefault(inter => inter.TouchId == touchIds[i]), Is.Not.Null);
                });
            }

            Assert.Multiple(() =>
            {
                Assert.That(_smoothing.InteractionsFramesCache.Length, Is.EqualTo(cacheSize));
                Assert.That(_smoothing.CurrentFrameId, Is.EqualTo(frameId));
                Assert.That(_smoothing.CurrentMaxId, Is.EqualTo(maxId));

                Assert.That(_smoothing.InteractionsFramesCache.ToList().TrueForAll(frame => frame.FrameId > 0), Is.True);
            });

        }
        
        private bool ValidateCache(List<InteractionFrame> interactionFrames)
        {
            var cache = _smoothing.InteractionsFramesCache;

            Assert.Multiple(() =>
            {
                Assert.That(cache.GroupBy(item => item.FrameId).Count(grp => grp.Count() > 1), Is.EqualTo(0));
                Assert.That(_smoothing.InteractionsFramesCache.Length, Is.EqualTo(interactionFrames.Count));

                Assert.That(interactionFrames.TrueForAll(frame => ValidateInteractionFrame(frame, cache)), Is.True);
            });

            return true;
        }

        private bool ValidateInteractionFrame(InteractionFrame frame, InteractionFrame[] cache)
        {
            var cached = cache.FirstOrDefault(item => item.FrameId == frame.FrameId);
            Assert.That(cached, Is.Not.Null);

            Assert.That(cached.Interactions.Count, Is.EqualTo(frame.Interactions.Count));
            Assert.Multiple(() =>
            {
                Assert.That(cached.Interactions.GroupBy(interaction => interaction.TouchId).Count(grp => grp.Count() > 1), Is.EqualTo(0));
                Assert.That(frame.Interactions.GroupBy(interaction => interaction.TouchId).Count(grp => grp.Count() > 1), Is.EqualTo(0));

                Assert.That(frame.Interactions.TrueForAll(interaction => ValidateInteractionInFrame(interaction, cached.Interactions)), Is.True);
            });

            return true;
        }

        private bool ValidateInteractionInFrame(Interaction interaction, List<Interaction> cachedInteractions)
        {
            var cachedInteraction =
                cachedInteractions.FirstOrDefault(item => item.TouchId == interaction.TouchId);

            Assert.That(ValidateInteractionMapping(interaction, cachedInteraction), Is.True);

            return true;
        }

        private bool ValidateInteractionMapping(Interaction interaction, Interaction cachedInteraction)
        {
            Assert.Multiple(() =>
            {
                Assert.That(cachedInteraction, Is.Not.Null);

                Assert.That(Math.Abs(interaction.Position.X - cachedInteraction.Position.X) < 1f, Is.True);
                Assert.That(Math.Abs(interaction.Position.Y - cachedInteraction.Position.Y) < 1f, Is.True);
                Assert.That(Math.Abs(interaction.Position.Z - cachedInteraction.Position.Z) < 0.01f, Is.True);
            });

            Assert.That(cachedInteraction.Type, Is.EqualTo(interaction.Type));
            
            // TODO: confidence and time cannot be asserted this easy - check anywhere else ? 

            return true;
        }
        
        
    }
}