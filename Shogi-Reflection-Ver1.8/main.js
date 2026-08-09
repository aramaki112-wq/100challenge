import { AddCurrentPositionToKeyPosition } from "./AddCurrentPositionToKeyPosition.js";
import { AnalyzeGame } from "./AnalyzeGame.js";
import { BrowserEngineAnalysisView } from "./BrowserEngineAnalysisView.js";
import { resolveBrowserEngine } from "./BrowserEngineProvider.js";
import { EngineAnalysisRepository } from "./EngineAnalysisRepository.js";
import { EngineAnalysisSnapshotService } from "./EngineAnalysisSnapshotService.js";
import { EngineAnalysisPersistenceCoordinator } from "./EngineAnalysisPersistenceCoordinator.js";
import { LocalStorageEngineAnalysisStore } from "./LocalStorageEngineAnalysisStore.js";
import { EngineAnalysisError, ENGINE_ERROR_CODES } from "./EngineErrors.js";
import { engineAnalysisSettings } from "./EngineAnalysisSettings.js";
import { BrowserApplicationView } from "./BrowserApplicationView.js";
import { BrowserClipboardAdapter } from "./BrowserClipboardAdapter.js";
import { BrowserFileAdapter } from "./BrowserFileAdapter.js";
import { BrowserFinalReportView } from "./BrowserFinalReportView.js";
import { BrowserGameReviewFormView } from "./BrowserGameReviewFormView.js";
import { BrowserGameReviewLibraryView } from "./BrowserGameReviewLibraryView.js";
import { BrowserKifClipboardAdapter } from "./BrowserKifClipboardAdapter.js";
import { BrowserKifImportView } from "./BrowserKifImportView.js";
import { BrowserMarkdownExportView } from "./BrowserMarkdownExportView.js";
import { BrowserShogiReplayView } from "./BrowserShogiReplayView.js";
import { BrowserStepNavigation, STEP_DEFINITIONS } from "./BrowserStepNavigation.js";
import { DeleteGameReview } from "./DeleteGameReview.js";
import { DeleteGameReviewAndPersist } from "./DeleteGameReviewAndPersist.js";
import { ExportGameReviewAsMarkdown } from "./ExportGameReviewAsMarkdown.js";
import { ExportObservationCardAsMarkdown } from "./ExportObservationCardAsMarkdown.js";
import { GameReviewEditMapper } from "./GameReviewEditMapper.js";
import { GameReviewFormMapper } from "./GameReviewFormMapper.js";
import { GameReviewLibraryPresenter } from "./GameReviewLibraryPresenter.js";
import { GameReviewMarkdownFormatter } from "./GameReviewMarkdownFormatter.js";
import { GameReviewSnapshotService } from "./GameReviewSnapshotService.js";
import { GetGameReview } from "./GetGameReview.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { KifFileReaderAdapter } from "./KifFileReaderAdapter.js";
import { KifImportApplicationService } from "./KifImportApplicationService.js";
import { KifImportController } from "./KifImportController.js";
import { KifImportDraftResetController } from "./KifImportDraftResetController.js";
import { KifImportErrorPresenter } from "./KifImportErrorPresenter.js";
import { KifImportFormMapper } from "./KifImportFormMapper.js";
import { KifImportPreviewPresenter } from "./KifImportPreviewPresenter.js";
import { KifParser } from "./KifParser.js";
import { KifPastedTextAdapter } from "./KifPastedTextAdapter.js";
import { KeyPositionReplayController } from "./KeyPositionReplayController.js";
import { KeyPositionReplayViewModel } from "./KeyPositionReplayViewModel.js";
import { ListGameReviews } from "./ListGameReviews.js";
import { LocalStorageSnapshotStore } from "./LocalStorageSnapshotStore.js";
import { MarkdownExportController } from "./MarkdownExportController.js";
import { ObservationCardMarkdownFormatter } from "./ObservationCardMarkdownFormatter.js";
import { PiyoShogiCompatibility } from "./PiyoShogiCompatibility.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { ReflectionBackupController } from "./ReflectionBackupController.js";
import { ReflectionPersistenceCoordinator } from "./ReflectionPersistenceCoordinator.js";
import { GAME_REVIEW_WORKFLOW_STATUS } from "./ReflectionWorkflowStatus.js";
import { ReviewIdGenerator } from "./ReviewIdGenerator.js";
import { SaveGameReview } from "./SaveGameReview.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";
import { ShogiReplayController } from "./ShogiReplayController.js";
import { ShogiReplayViewModel } from "./ShogiReplayViewModel.js";
import { GAME_REVIEW_SAVE_INTENT, SubmitGameReviewForm } from "./SubmitGameReviewForm.js";

const repository = new InMemoryGameReviewRepository();
const snapshotService = new GameReviewSnapshotService({ repository });
const snapshotStore = new LocalStorageSnapshotStore({ storage: window.localStorage });
const persistenceCoordinator = new ReflectionPersistenceCoordinator({ snapshotService, snapshotStore });
const backupController = new ReflectionBackupController({ persistenceCoordinator });
const listGameReviews = new ListGameReviews({ repository });
const getGameReview = new GetGameReview({ repository });
const reviewIdGenerator = new ReviewIdGenerator();
const keyPositionReplayViewModel = new KeyPositionReplayViewModel();
const formView = new BrowserGameReviewFormView({ snapshotViewModel: keyPositionReplayViewModel });
const appView = new BrowserApplicationView();
const stepNavigation = new BrowserStepNavigation();
const finalReportView = new BrowserFinalReportView();
const kifImportView = new BrowserKifImportView();
const kifParser = new KifParser();
const kifImportController = new KifImportController({
  importService: new KifImportApplicationService({
    fileReader: new KifFileReaderAdapter(),
    parser: kifParser,
    compatibility: new PiyoShogiCompatibility(),
    previewPresenter: new KifImportPreviewPresenter()
  }),
  formMapper: new KifImportFormMapper(),
  pastedTextAdapter: new KifPastedTextAdapter()
});
const kifClipboardAdapter = new BrowserKifClipboardAdapter();
const kifImportErrorPresenter = new KifImportErrorPresenter();
const kifImportDraftResetController = new KifImportDraftResetController({ importController: kifImportController, view: kifImportView });
const libraryView = new BrowserGameReviewLibraryView();
const libraryPresenter = new GameReviewLibraryPresenter();
const replayView = new BrowserShogiReplayView();
const replayController = new ShogiReplayController({
  parser: kifParser,
  historyBuilder: new PositionHistoryBuilder(),
  replayService: new ShogiReplayApplicationService(),
  viewModel: new ShogiReplayViewModel(),
  view: replayView
});
const keyPositionReplayController = new KeyPositionReplayController({
  addCurrentPosition: new AddCurrentPositionToKeyPosition(),
  formView,
  replayController,
  viewModel: keyPositionReplayViewModel
});
const engineAnalysisRepository = new EngineAnalysisRepository();
const engineAnalysisSnapshotService = new EngineAnalysisSnapshotService({ repository: engineAnalysisRepository });
const engineAnalysisPersistence = new EngineAnalysisPersistenceCoordinator({
  snapshotService: engineAnalysisSnapshotService,
  store: new LocalStorageEngineAnalysisStore({ storage: window.localStorage })
});
const engineAnalysisView = new BrowserEngineAnalysisView();
const editMapper = new GameReviewEditMapper();
const fileAdapter = new BrowserFileAdapter();
const markdownExportView = new BrowserMarkdownExportView();
const markdownExportController = new MarkdownExportController({
  reviewExporter: new ExportGameReviewAsMarkdown({ getGameReview, formatter: new GameReviewMarkdownFormatter() }),
  observationCardExporter: new ExportObservationCardAsMarkdown({ getGameReview, formatter: new ObservationCardMarkdownFormatter() }),
  clipboardAdapter: new BrowserClipboardAdapter(),
  fileAdapter
});
const submitGameReviewForm = new SubmitGameReviewForm({
  mapper: new GameReviewFormMapper(),
  saveGameReview: new SaveGameReview({ repository }),
  persistenceCoordinator
});
const deleteGameReviewAndPersist = new DeleteGameReviewAndPersist({
  deleteGameReview: new DeleteGameReview({ repository }),
  snapshotService,
  persistenceCoordinator
});

let replayAvailable = false;
let activeReplaySource = null;
let activeMarkdownArtifact = null;
let currentHasUnsavedChanges = false;
let activeAnalyzeGame = null;
let activeAnalysisAbortController = null;
let activeEngine = null;

function toLocalDateTimeValue(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function missingItemLabels(items = []) {
  const labels = {
    KEY_POSITIONS: "重要局面を3件以上記録する",
    OBSERVATION_THEME: "次局の観察テーマを1件決める",
    ACTION_RULES: "実行Ruleを1件以上決める"
  };
  return items.map((item) => labels[item] ?? item);
}

function showUnexpected(error) {
  console.error(error);
  formView.showFeedback({
    kind: "error",
    title: "処理できませんでした",
    message: error?.message ?? "予期しないエラーが発生しました。",
    details: error?.code ? [error.code] : []
  });
}

async function cancelActiveAnalysis({ showCancelled = false } = {}) {
  if (!activeAnalyzeGame && !activeEngine) return;
  if (showCancelled) engineAnalysisView.showCancelling();
  try {
    activeAnalysisAbortController?.abort();
    await activeAnalyzeGame?.cancel?.();
    await activeEngine?.dispose?.();
  } catch (error) {
    console.warn("Engine解析中止時の警告", error);
  } finally {
    activeAnalyzeGame = null;
    activeAnalysisAbortController = null;
    activeEngine = null;
    if (showCancelled) engineAnalysisView.showCancelled();
  }
}

function renderSavedAnalysis(gameId) {
  const latest = engineAnalysisRepository.findLatestByGameId(gameId);
  if (latest) engineAnalysisView.renderResult(latest);
  else engineAnalysisView.showUnanalyzed();
}

function loadReplay(kifuText, {
  sourceFileName = "",
  sourceGameId = formView.readInput().reviewId,
  savedReviewId = null,
  scroll = false
} = {}) {
  const result = replayController.loadKifText(kifuText, { sourceFileName });
  replayAvailable = result.status !== "REJECTED";
  activeReplaySource = replayAvailable ? Object.freeze({
    sourceGameId,
    sourceKifText: String(kifuText ?? ""),
    savedReviewId
  }) : null;
  replayView.setKeyPositionCount(formView.getMeaningfulKeyPositionCount());
  if (scroll) replayView.scrollIntoView();
  return result;
}

function analysisStatusView(gameId) {
  const latest = engineAnalysisRepository.findLatestByGameId(gameId);
  return Object.freeze({
    analysisStatus: latest ? "ANALYZED" : "UNANALYZED",
    analysisStatusLabel: latest ? "解析済み" : "未解析"
  });
}

function withAnalysisStatus(viewModel) {
  return Object.freeze({ ...viewModel, ...analysisStatusView(viewModel.reviewId) });
}

function refreshLibrary({ selectedReviewId = null } = {}) {
  const result = listGameReviews.execute();
  const presented = libraryPresenter.presentList(result.gameReviews);
  const presentedWithAnalysis = Object.freeze({
    ...presented,
    items: Object.freeze(presented.items.map((item) => withAnalysisStatus(item)))
  });
  formView.updateSavedCount(presentedWithAnalysis.count);
  libraryView.renderList(presentedWithAnalysis);
  if (selectedReviewId && result.gameReviews.some((item) => item.reviewId === selectedReviewId)) {
    const found = getGameReview.execute({ reviewId: selectedReviewId });
    libraryView.renderDetail(withAnalysisStatus(libraryPresenter.presentDetail(found.gameReview)));
  } else {
    libraryView.clearDetail();
  }
  return result;
}

function prepareNewReview() {
  void cancelActiveAnalysis();
  formView.resetForNextReview({ reviewId: reviewIdGenerator.generate(), localDateTimeValue: toLocalDateTimeValue() });
  replayAvailable = false;
  activeReplaySource = null;
  currentHasUnsavedChanges = false;
  replayView.showUnavailable("新しい対局です。STEP1でKIFを登録してください。");
  engineAnalysisView.showUnanalyzed({ message: "未解析" });
  finalReportView.render(formView.readInput());
  stepNavigation.goTo(1);
  appView.show("WORKFLOW");
}

function chooseResumeStep(snapshot) {
  if (snapshot.workflowStatus === GAME_REVIEW_WORKFLOW_STATUS.REFLECTION_COMPLETE) return 7;
  if ((snapshot.keyPositions?.length ?? 0) < 3) return 3;
  if (!String(snapshot.observationTheme ?? "").trim() || !(snapshot.actionRules?.length)) return 6;
  return 7;
}

function openReview(reviewId, { step = null, buildReplay = true } = {}) {
  void cancelActiveAnalysis();
  const found = getGameReview.execute({ reviewId });
  formView.loadInput(editMapper.toFormInput(found.gameReview), { replayReferencesAreSaved: true });
  replayView.setKeyPositionCount(formView.getMeaningfulKeyPositionCount());
  kifImportView.setSelectedSide(found.gameReview.side);
  if (buildReplay) {
    loadReplay(found.gameReview.kifuText, {
      sourceGameId: found.gameReview.reviewId,
      savedReviewId: found.gameReview.reviewId,
      scroll: false
    });
  }
  currentHasUnsavedChanges = false;
  renderSavedAnalysis(found.gameReview.reviewId);
  appView.show("WORKFLOW");
  const targetStep = step ?? chooseResumeStep(found.gameReview);
  stepNavigation.goTo(targetStep);
  if (targetStep === 7) finalReportView.render(formView.readInput());
  formView.showFeedback({
    kind: "info",
    title: "保存済み対局を編集状態へ移しました",
    message: `${found.gameReview.reviewId}の${found.gameReview.workflowStatus === "REFLECTION_COMPLETE" ? "完成済み振り返り" : "続き"}を表示しています。`,
    focus: false
  });
  return found;
}

function showReviewDetail(reviewId) {
  const found = getGameReview.execute({ reviewId });
  libraryView.renderDetail(withAnalysisStatus(libraryPresenter.presentDetail(found.gameReview)));
  return found;
}

function saveCurrent(intent, { exitToLibrary = false } = {}) {
  const result = submitGameReviewForm.execute({ input: formView.readInput(), intent });
  if (result.status === "REJECTED") {
    const details = result.context?.missingReflectionItems
      ? missingItemLabels(result.context.missingReflectionItems)
      : [result.errorCode];
    formView.showFeedback({
      kind: "error",
      title: intent === GAME_REVIEW_SAVE_INTENT.COMPLETE_REFLECTION ? "振り返りを完了できません" : "入力を保存できません",
      message: result.message,
      details
    });
    return result;
  }

  formView.setLifecycleMetadata(result.gameReview);
  formView.markReplayReferencesSaved();
  currentHasUnsavedChanges = false;
  refreshLibrary({ selectedReviewId: result.gameReview.reviewId });

  if (result.status === "SAVED_IN_MEMORY_ONLY") {
    formView.showFeedback({
      kind: "warning",
      title: "一時メモリには保存しました",
      message: "ブラウザへの永続保存に失敗しました。画面を閉じる前にJSONバックアップを作成してください。",
      details: [result.persistenceErrorCode]
    });
    return result;
  }

  const statusLabel = result.gameReview.workflowStatus === GAME_REVIEW_WORKFLOW_STATUS.GAME_ONLY
    ? "棋譜のみ"
    : result.gameReview.workflowStatus === GAME_REVIEW_WORKFLOW_STATUS.REFLECTION_COMPLETE
      ? "振り返り完了"
      : "振り返り中";
  formView.showFeedback({
    kind: result.gameReview.workflowStatus === GAME_REVIEW_WORKFLOW_STATUS.REFLECTION_COMPLETE ? "success" : "info",
    title: result.saveStatus === "CREATED" ? "対局を保存しました" : "対局を更新しました",
    message: `現在の状態：${statusLabel}。${statusLabel === "棋譜のみ" ? "重要局面が0件でも保存済みです。" : statusLabel === "振り返り中" ? "後日この続きから再開できます。" : "最終レポートとObservation Cardを利用できます。"}`,
    details: result.gameReview.workflowStatus === GAME_REVIEW_WORKFLOW_STATUS.REFLECTION_COMPLETE ? [] : missingItemLabels(result.gameReview.missingReflectionItems)
  });

  if (exitToLibrary) {
    appView.show("LIBRARY");
    showReviewDetail(result.gameReview.reviewId);
  }
  return result;
}

async function previewKifFile(file) {
  try {
    const result = await kifImportController.selectFile({ file });
    kifImportView.setSelectedSide(formView.readInput().side);
    kifImportView.renderPreview(result.preview);
  } catch (error) {
    console.error(error);
    kifImportView.showFeedback(kifImportErrorPresenter.present(error));
  }
}

async function previewKifText(text, { sourceFileName = "clipboard-paste.kifu" } = {}) {
  try {
    const result = await kifImportController.selectText({ text, sourceFileName });
    kifImportView.setSelectedSide(formView.readInput().side);
    kifImportView.renderPreview(result.preview);
  } catch (error) {
    console.error(error);
    kifImportView.showFeedback(kifImportErrorPresenter.present(error));
  }
}

function applyPendingKifImport() {
  try {
    const result = kifImportController.applyToForm({
      currentForm: formView.readInput(),
      mySide: kifImportView.getSelectedSide()
    });
    formView.loadInput(result.form);
    replayView.setKeyPositionCount(formView.getMeaningfulKeyPositionCount());
    loadReplay(result.form.kifuText, { sourceGameId: result.form.reviewId, scroll: false });
    currentHasUnsavedChanges = true;
    kifImportView.clearPreview("KIFを対局情報へ反映しました。まだ保存済み対局やブラウザ保存データは変更されていません。");
    formView.showFeedback({
      kind: result.warnings.length > 0 ? "warning" : "success",
      title: "棋譜を登録しました",
      message: "STEP2で対局情報を確認し、そのまま棋譜だけ保存できます。",
      details: result.warnings.map((item) => `${item.code}: ${item.message}`),
      focus: false
    });
    stepNavigation.goTo(2);
  } catch (error) {
    console.error(error);
    kifImportView.showFeedback(kifImportErrorPresenter.present(error));
  }
}

function showMarkdownArtifact(artifact) {
  activeMarkdownArtifact = artifact;
  markdownExportView.renderArtifact(artifact);
  appView.show("WORKFLOW");
  stepNavigation.goTo(7);
  markdownExportView.scrollIntoView();
  formView.showFeedback({
    kind: "success",
    title: artifact.kind === "OBSERVATION_CARD_MARKDOWN" ? "次局用Observation Cardを作成しました" : "振り返りMarkdownを作成しました",
    message: `${artifact.fileName}を確認しています。`
  });
}

function deleteReview(reviewId) {
  const accepted = window.confirm("この保存済み対局を削除します。KIF入力の『入力をクリア』とは別操作です。削除を続けますか？");
  if (!accepted) return;
  const result = deleteGameReviewAndPersist.execute({ reviewId });
  if (result.status === "DELETE_ROLLED_BACK") {
    refreshLibrary({ selectedReviewId: reviewId });
    formView.showFeedback({ kind: "error", title: "削除を確定できませんでした", message: result.message, details: [result.persistenceErrorCode] });
    return;
  }
  if (result.status === "NOT_FOUND") {
    refreshLibrary();
    formView.showFeedback({ kind: "warning", title: "削除対象がありません", message: `${reviewId}は存在しません。` });
    return;
  }
  if (formView.readInput().reviewId === reviewId) prepareNewReview();
  if (activeMarkdownArtifact?.sourceReviewId === reviewId) {
    activeMarkdownArtifact = null;
    markdownExportView.clear();
  }
  refreshLibrary();
  appView.show("LIBRARY");
  formView.showFeedback({ kind: "success", title: "保存済み対局を削除しました", message: `${reviewId}を削除しました。` });
}

function navigateToStep(step) {
  appView.show("WORKFLOW");
  stepNavigation.goTo(step);
  if (step === 3 && !replayAvailable) {
    const input = formView.readInput();
    if (String(input.kifuText ?? "").trim()) loadReplay(input.kifuText, { sourceGameId: input.reviewId, scroll: false });
  }
  if (step === 7) finalReportView.render(formView.readInput());
}

formView.initializeKeyPositions();
prepareNewReview();
libraryView.clearDetail();
markdownExportView.clear();
try { engineAnalysisPersistence.loadFromBrowser(); } catch (error) { console.warn("Engine解析履歴を読み込めませんでした。", error); }
try {
  const restored = backupController.loadFromBrowserData();
  refreshLibrary();
  if (restored.status === "RESTORED_FROM_BROWSER") {
    formView.showFeedback({ kind: "success", title: "保存済み対局を読み込みました", message: `${restored.count}件を復元しました。`, focus: false });
  }
} catch (error) {
  refreshLibrary();
  showUnexpected(error);
}

// Global navigation
for (const [id, action] of [
  ["nav-library", () => { refreshLibrary(); appView.show("LIBRARY"); }],
  ["nav-help", () => appView.show("HELP")],
  ["help-back-workflow", () => appView.show("WORKFLOW")]
]) document.getElementById(id).addEventListener("click", action);

document.getElementById("nav-new-game").addEventListener("click", () => {
  if (currentHasUnsavedChanges && !window.confirm("未保存の入力があります。新しい対局へ切り替えますか？")) return;
  prepareNewReview();
});

document.querySelectorAll("[data-help-target]").forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault();
  appView.show("HELP");
  document.getElementById(link.dataset.helpTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
}));

// Step navigation: UI stateだけを変更し、Domain Dataは保存・削除しない。
document.getElementById("step-menu").addEventListener("change", (event) => navigateToStep(Number(event.target.value)));
document.getElementById("step-previous").addEventListener("click", () => navigateToStep(stepNavigation.current - 1));
document.getElementById("step-next").addEventListener("click", () => navigateToStep(stepNavigation.current + 1));

document.getElementById("game-review-form").addEventListener("input", (event) => {
  if (event.target.name !== "workflowStatus" && event.target.name !== "createdAt" && event.target.name !== "updatedAt") currentHasUnsavedChanges = true;
});

// KIF import
const kifFileInput = document.getElementById("kif-file-input");
kifFileInput.addEventListener("change", async (event) => {
  await previewKifFile(event.target.files?.[0] ?? null);
  event.target.value = "";
});
const kifDropZone = document.getElementById("kif-drop-zone");
for (const eventName of ["dragenter", "dragover"]) kifDropZone.addEventListener(eventName, (event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; kifImportView.setDropActive(true); });
for (const eventName of ["dragleave", "dragend"]) kifDropZone.addEventListener(eventName, (event) => { event.preventDefault(); kifImportView.setDropActive(false); });
kifDropZone.addEventListener("drop", async (event) => { event.preventDefault(); kifImportView.setDropActive(false); await previewKifFile(event.dataTransfer?.files?.[0] ?? null); });
kifDropZone.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); kifFileInput.click(); } });
document.getElementById("preview-kif-paste").addEventListener("click", async () => previewKifText(kifImportView.getPastedText()));
document.getElementById("read-kif-clipboard").addEventListener("click", async () => {
  try {
    const text = await kifClipboardAdapter.readText();
    kifImportView.setPastedText(text);
    await previewKifText(text);
  } catch (error) {
    console.error(error);
    kifImportView.showFeedback(kifImportErrorPresenter.present(error));
    kifImportView.focusPastedText();
  }
});
document.getElementById("apply-kif-import").addEventListener("click", applyPendingKifImport);
document.getElementById("clear-kif-paste").addEventListener("click", () => kifImportDraftResetController.clearInput());
document.getElementById("cancel-kif-import").addEventListener("click", () => kifImportDraftResetController.retryInput());

// Save lifecycle
// SAVE_GAME does not require KeyPosition / Observation Theme / Execution Rule.
document.getElementById("save-game-and-exit").addEventListener("click", () => saveCurrent(GAME_REVIEW_SAVE_INTENT.SAVE_GAME, { exitToLibrary: true }));
document.getElementById("game-review-form").addEventListener("submit", (event) => {
  event.preventDefault();
  saveCurrent(GAME_REVIEW_SAVE_INTENT.SAVE_REFLECTION_DRAFT);
});
document.getElementById("complete-reflection").addEventListener("click", () => {
  finalReportView.render(formView.readInput());
  const result = saveCurrent(GAME_REVIEW_SAVE_INTENT.COMPLETE_REFLECTION);
  if (result.status !== "REJECTED") finalReportView.render(formView.readInput());
});
document.getElementById("refresh-final-report").addEventListener("click", () => finalReportView.render(formView.readInput()));

// Replay
function replayStepAction(action) {
  const rendered = action();
  return rendered;
}
document.getElementById("replay-current-form").addEventListener("click", () => { const input = formView.readInput(); loadReplay(input.kifuText, { sourceGameId: input.reviewId, scroll: false }); });
document.getElementById("replay-first").addEventListener("click", () => replayStepAction(() => replayController.first()));
document.getElementById("replay-previous").addEventListener("click", () => replayStepAction(() => replayController.previous()));
document.getElementById("replay-next").addEventListener("click", () => replayStepAction(() => replayController.next()));
document.getElementById("replay-last").addEventListener("click", () => replayStepAction(() => replayController.last()));
document.getElementById("replay-flip").addEventListener("click", () => replayController.toggleFlip());
const replayRange = document.getElementById("replay-jump");
const replayNumber = document.getElementById("replay-jump-number");
replayRange.addEventListener("input", () => replayController.jump(Number(replayRange.value)));
document.getElementById("replay-jump-button").addEventListener("click", () => replayController.jump(Number(replayNumber.value)));
replayNumber.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); replayController.jump(Number(replayNumber.value)); } });
document.getElementById("replay-move-list").addEventListener("click", (event) => {
  const moveButton = event.target.closest("[data-jump]");
  if (!moveButton) return;
  replayController.jump(Number(moveButton.dataset.jump));
  // Ver.1.7: Move List JumpもPage全体を移動させず、Move List Container内の追従だけに限定する。
});
document.addEventListener("keydown", (event) => {
  if (!replayAvailable || event.altKey || event.ctrlKey || event.metaKey || stepNavigation.current !== 3) return;
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable) return;
  const actions = { ArrowLeft: () => replayController.previous(), ArrowRight: () => replayController.next(), Home: () => replayController.first(), End: () => replayController.last() };
  const action = actions[event.key];
  if (action) { event.preventDefault(); action(); }
});

// KeyPosition
function addCurrentReplayPositionToKeyPosition({ focus = true, showFormFeedback = true } = {}) {
  if (!activeReplaySource) {
    replayView.showAddResult({ kind: "error", message: "棋譜再現を開始してから追加してください。" });
    return null;
  }
  if (activeReplaySource.savedReviewId && formView.readInput().reviewId !== activeReplaySource.savedReviewId) {
    const found = getGameReview.execute({ reviewId: activeReplaySource.savedReviewId });
    formView.loadInput(editMapper.toFormInput(found.gameReview), { replayReferencesAreSaved: true });
  }
  const input = formView.readInput();
  const result = keyPositionReplayController.add({ sourceGameId: input.reviewId, sourceKifText: input.kifuText, focus });
  replayView.setKeyPositionCount(formView.getMeaningfulKeyPositionCount());
  if (result.status === "REJECTED") {
    replayView.showAddResult({ kind: "error", message: `${result.viewError.message}（${result.viewError.code}）` });
    if (focus && result.duplicateIndex !== undefined) formView.focusKeyPosition(result.duplicateIndex);
    return result;
  }
  currentHasUnsavedChanges = true;
  replayView.showAddResult({ kind: result.hasWarning ? "warning" : "success", message: `${result.moveNumber}手目 ${result.currentMove}を重要局面候補へ追加しました。まだ保存されていません。` });
  if (showFormFeedback) formView.showFeedback({ kind: result.hasWarning ? "warning" : "success", title: "現在局面を重要局面候補へ追加しました", message: "局面記録だけを反映しました。FACT／INTERPRETATION／HYPOTHESISは自分で入力してください。", focus: false });
  return result;
}

document.getElementById("add-current-position").addEventListener("click", () => {
  try { addCurrentReplayPositionToKeyPosition(); } catch (error) { showUnexpected(error); }
});
document.getElementById("add-key-position").addEventListener("click", () => { formView.addKeyPosition(); replayView.setKeyPositionCount(formView.getMeaningfulKeyPositionCount()); currentHasUnsavedChanges = true; });
document.getElementById("key-position-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-key-position]");
  if (button) { formView.removeKeyPosition(button); replayView.setKeyPositionCount(formView.getMeaningfulKeyPositionCount()); currentHasUnsavedChanges = true; }
});

// Engine Analysis: optional capability. GameReview Domain remains independent.
document.getElementById("analyze-game").addEventListener("click", async () => {
  const input = formView.readInput();
  if (!String(input.kifuText ?? "").trim()) {
    engineAnalysisView.showError(new EngineAnalysisError(ENGINE_ERROR_CODES.INVALID_RESPONSE, "KIFを登録してから解析してください。"));
    return;
  }
  try {
    await cancelActiveAnalysis();
    if (!replayAvailable) loadReplay(input.kifuText, { sourceGameId: input.reviewId, savedReviewId: input.reviewId, scroll: false });
    engineAnalysisView.showInitializing();
    activeEngine = await resolveBrowserEngine(window);
    activeAnalyzeGame = new AnalyzeGame({ engine: activeEngine });
    activeAnalysisAbortController = new AbortController();
    const history = replayController.getCurrentState().history;
    const appliedSettings = engineAnalysisSettings("STANDARD");
    const totalAnalysisPositions = Math.min(history.maxMoveNumber, appliedSettings.maxPlies ?? history.maxMoveNumber) + 1;
    engineAnalysisView.showAnalyzing({ completed: 0, total: totalAnalysisPositions });
    const result = await activeAnalyzeGame.execute({
      gameId: input.reviewId,
      history,
      playerSide: input.side,
      settings: "STANDARD",
      signal: activeAnalysisAbortController.signal,
      onProgress: ({ completed, total }) => engineAnalysisView.showAnalyzing({ completed, total })
    });
    engineAnalysisRepository.save(result);
    engineAnalysisPersistence.saveToBrowser();
    engineAnalysisView.renderResult(result);
  } catch (error) {
    if (error?.code === ENGINE_ERROR_CODES.ANALYSIS_CANCELLED) engineAnalysisView.showCancelled();
    else engineAnalysisView.showError(error);
  } finally {
    try { await activeEngine?.dispose?.(); } catch (error) { console.warn(error); }
    activeAnalyzeGame = null; activeAnalysisAbortController = null; activeEngine = null;
  }
});

document.getElementById("cancel-analysis").addEventListener("click", () => { void cancelActiveAnalysis({ showCancelled: true }); });
document.addEventListener("visibilitychange", () => {
  // Smartphone/browser backgrounding is treated as a resource-safety boundary.
  // Do not keep an analysis Worker consuming CPU while the page is hidden.
  if (document.hidden && (activeAnalyzeGame || activeEngine)) void cancelActiveAnalysis({ showCancelled: true });
});
document.getElementById("engine-analysis-candidates").addEventListener("click", (event) => {
  const replayButton = event.target.closest("[data-engine-replay-ply]");
  if (replayButton) {
    // Ver.1.7: Engine Panel is already inside STEP3. Candidate Jump uses the existing Replay only
    // and must not request Browser Page scroll; Move List following stays inside ReplayScrollPolicy.
    replayController.jump(Number(replayButton.dataset.engineReplayPly));
    return;
  }
  const addButton = event.target.closest("[data-engine-add-key-position]");
  if (addButton) {
    try {
      const rendered = replayController.jump(Number(addButton.dataset.engineAddKeyPosition));
      if (rendered) addCurrentReplayPositionToKeyPosition({ focus: false, showFormFeedback: false });
    } catch (error) { showUnexpected(error); }
  }
});

// Saved Game Viewer
document.getElementById("new-review").addEventListener("click", () => {
  if (currentHasUnsavedChanges && !window.confirm("未保存の入力があります。新しい対局へ切り替えますか？")) return;
  prepareNewReview();
});
document.getElementById("saved-review-library").addEventListener("click", (event) => {
  const observationCardButton = event.target.closest("[data-preview-observation-card]");
  if (observationCardButton) { try { showMarkdownArtifact(markdownExportController.createObservationCardMarkdown({ reviewId: observationCardButton.dataset.previewObservationCard })); } catch (error) { showUnexpected(error); } return; }
  const reviewMarkdownButton = event.target.closest("[data-preview-review-markdown]");
  if (reviewMarkdownButton) { try { showMarkdownArtifact(markdownExportController.createGameReviewMarkdown({ reviewId: reviewMarkdownButton.dataset.previewReviewMarkdown })); } catch (error) { showUnexpected(error); } return; }
  const deleteButton = event.target.closest("[data-delete-review]");
  if (deleteButton) { try { deleteReview(deleteButton.dataset.deleteReview); } catch (error) { showUnexpected(error); } return; }
  const replayButton = event.target.closest("[data-replay-review]");
  if (replayButton) { try { openReview(replayButton.dataset.replayReview, { step: 3, buildReplay: true }); } catch (error) { showUnexpected(error); } return; }
  const editButton = event.target.closest("[data-edit-review]");
  if (editButton) { try { openReview(editButton.dataset.editReview); } catch (error) { showUnexpected(error); } return; }
  const viewButton = event.target.closest("[data-view-review]");
  if (viewButton) { try { showReviewDetail(viewButton.dataset.viewReview); } catch (error) { showUnexpected(error); } }
});

// Markdown
document.getElementById("copy-markdown").addEventListener("click", async () => {
  try { const result = await markdownExportController.copy({ artifact: activeMarkdownArtifact }); formView.showFeedback({ kind: "success", title: "Markdownをコピーしました", message: `${result.fileName}をClipboardへコピーしました。` }); } catch (error) { showUnexpected(error); }
});
document.getElementById("download-markdown").addEventListener("click", () => {
  try { const result = markdownExportController.download({ artifact: activeMarkdownArtifact }); formView.showFeedback({ kind: "success", title: ".mdを書き出しました", message: `${result.fileName}を保存しました。` }); } catch (error) { showUnexpected(error); }
});

// Backup / Restore
document.getElementById("save-browser").addEventListener("click", () => { try { const result = backupController.saveCurrentDataToBrowser(); formView.showFeedback({ kind: "success", title: "ブラウザへ保存しました", message: `${result.byteLength}バイトを書き込みました。` }); } catch (error) { showUnexpected(error); } });
document.getElementById("load-browser").addEventListener("click", () => {
  try { const result = backupController.loadFromBrowserData(); activeMarkdownArtifact = null; markdownExportView.clear(); refreshLibrary(); formView.showFeedback({ kind: result.status === "EMPTY" ? "warning" : "success", title: result.status === "EMPTY" ? "保存データがありません" : "ブラウザ保存データを読み込みました", message: result.status === "EMPTY" ? "復元対象はありません。" : `${result.count}件を復元しました。` }); } catch (error) { showUnexpected(error); }
});
document.getElementById("download-backup").addEventListener("click", () => { try { const backup = backupController.createBackupJson(); fileAdapter.downloadText({ fileName: backup.fileName, text: backup.jsonText }); formView.showFeedback({ kind: "success", title: "JSONバックアップを作成しました", message: `${backup.gameReviewCount}件を出力しました。` }); } catch (error) { showUnexpected(error); } });
document.getElementById("restore-backup").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try { const jsonText = await fileAdapter.readText(file); const result = backupController.restoreBackupJson({ jsonText }); backupController.saveCurrentDataToBrowser(); activeMarkdownArtifact = null; markdownExportView.clear(); refreshLibrary(); formView.showFeedback({ kind: "success", title: "JSONバックアップを復元しました", message: `${result.count}件を復元しました。` }); } catch (error) { showUnexpected(error); } finally { event.target.value = ""; }
});
document.getElementById("delete-browser").addEventListener("click", () => {
  if (!window.confirm("ブラウザ保存Dataだけを削除します。現在メモリ上の対局は削除されません。続けますか？")) return;
  try { backupController.deleteBrowserSavedData(); formView.showFeedback({ kind: "warning", title: "ブラウザ保存Dataを削除しました", message: "現在メモリ上の対局は維持されています。" }); } catch (error) { showUnexpected(error); }
});

// Export step definitions for static/browser verification without making Navigation a Domain concern.
void STEP_DEFINITIONS;
